
/*********************************************************************/
/*********************************************************************/
/*************************** Core Routines ***************************/
/*********************************************************************/
/*********************************************************************/


/*****************************************************************************/
/************************** Internal Data Structure **************************/
/*****************************************************************************/

// options
var allowconflicts = false;
var debug = true;
var casesensitive = true;
var useshortnames = true;
var valuecount = 0;
var fancyoptions = (BrowserDetect.browser === 'Firefox' && BrowserDetect.OS === 'Mac');

// unimplemented
var minconflicts = {};  // map from component to all minimal inconsistent sets

// represent cells with a hashtable of cell objects
var cells = {};

// One cell object for each widget in the spreadsheet.
function cell (name, type, style, negs, poss, negsupports, possupports, negsupportx, possupportx, component, undef, value, unique, disabled) {
	this.name = name;   // string
	this.type = type;   // collection object or named type, e.g. 'number'
	this.style = style.toLowerCase();  // string for selector,textbox,etc
	this.negs = negs;   // function
	this.poss = poss;   // function
	this.negsupports = negsupports;   // function
	this.possupports = possupports;   // function
	this.negsupportx = negsupportx;   // function
	this.possupportx = possupportx;   // function
	this.component = component;   // collection
    this.unique = unique;
    if (undef === undefined) this.undef = false; else this.undef = undef;
	this.externalInit(value,disabled);
}

cell.prototype.externalInit = function (val,disabled) {
	if (val === undefined || val instanceof set) {
		if (val !== undefined && val.empty()) val = undefined;
		this.value = val;
		this.clearConflictset();
		this.clearForceset(); 
		this.clearImplied();
		if (disabled !== undefined) {
			if (typeof disabled === 'boolean') this.disabled = disabled;
			else this.disabled = false; }
		this.userset = (this.value !== undefined) || this.disabled === true; }}

// reset cell to undefined
cell.prototype.deleteVal = function() { 
	if (this.undef) {
		this.value = undefined;
		this.clearConflictset();
		this.clearForceset(); 
		this.userset = (this.disabled === true); }}


/*		
	function maknot (v) { 
		return prettyname(v) === 'true' ? uglyname('false') : uglyname('true'); }

		switch (this.style) {
			case 'selector': this.value = undefined; break;
			case 'radio': this.value = undefined; break;
			case 'textbox': 
				if (this.undef) this.value = undefined;
				else this.value = new set(uglyname('')); break; 
			case 'checkbox': 
				if (this.value === undefined) this.value = new set(uglyname('false')); 
				else this.value = this.value.mapcar(maknot).toSet(); 
				break; }}}
*/

/* Pull GUI value into object */
cell.prototype.pullGUI = function (internal) {
	var htmlcells = document.getElementsByName(this.name);
	var htmlcell = htmlcells[0];
	if (!internal) this.userset = true;
	this.forceset = new set();
	this.conflictset = new set();
	switch (this.style) {
		case 'selector': 
			this.value = new set();
			for (var i=0; i<htmlcell.options.length; i++)
				if (htmlcell.options[i].selected)
					if (htmlcell.options[i].value === 'undefined')
						break;
					else
						this.value.adjoin(formvalue(htmlcell.options[i].value));
			if (this.undef && this.value.empty()) this.deleteVal();
			break;
		case 'textbox':
			// update universe by removing current values
			if (this.value !== undefined) 
				this.value.mapc(function (x) { univ.remove(new expr(x)); });

			// grab new values
			if (this.unique) {
				if (this.undef && htmlcell.value === "") this.deleteVal();
				else this.value = new set (uglyname(htmlcell.value));
			} else {
				this.value = new set();
				for (var i=0; i<htmlcells.length; i++)
					if (!inside(htmlcells[i], this.ghost()))
						this.value.adjoin(uglyname(htmlcells[i].value))
				if (this.undef && this.value.empty()) this.deleteVal(); }

			// update universe by adding new values
			if (this.value !== undefined) 
				this.value.mapc(function (x) { univ.add(new expr(x)); });
			break;
		case 'radio': 
			this.value = new set();
			var radios = document.getElementsByName(this.name);
			for (var i = 0; i < radios.length; i++) 
				if (radios[i].checked)
					if (radios[i].value === 'undefined')
						{ this.deleteVal(); break; }
					else this.value.adjoin(formvalue(radios[i].value));
			break;
		case 'checkbox':
			var checks = document.getElementsByName(this.name);
			if (this.undef) {  // multiple boxes
				this.value = new set();
				for (var i = 0; i < checks.length; i++) 
					if (checks[i].checked)
						this.value.adjoin(formvalue(checks[i].value));
				if (this.value.empty()) this.deleteVal(); }
			else this.value = new set(uglyname(checks[0].checked));
			break; }
	if (this.value === undefined) this.userset = false;
	return true; }

/* Push object's value to GUI */
cell.prototype.pushGUI = function (value) {
	// call deleteGUI if want to set to undefined
	if (value === undefined || !(value instanceof set)) value = this.value;
	var htmlcells = document.getElementsByName(this.name);
	if (value === undefined) this.deleteGUI();
	else
	switch (this.style) {
		case 'selector': 
			for (var i=0; i < htmlcells[0].options.length; i++) 
				htmlcells[0].options[i].selected = 	
					(value.member(formvalue(htmlcells[0].options[i].value)));
			break;
			
		case 'radio':  // uniqueness is required
			for (var i = 0; i < htmlcells.length; i++) 
				if (value.member(formvalue(htmlcells[i].value))) {
					htmlcells[i].checked = true; 
					break; }
			break;
			
		case 'textbox': 
			if (this.unique)
				htmlcells[0].value = prettyname(value.element(0));
			else { 
				var len = value.size() + 1;
				// add rows if necessary
				for (var i=htmlcells.length; i<len; i++)
					addTableRow(this.ghost(), document.getElementById(this.bottom()));
				// update cell array
				htmlcells = document.getElementsByName(this.name);
				// remove extra rows (leaving ghost)
				for (var i=len; i<htmlcells.length; i++)
					remTableRow(htmlcells[i]);
				// fill in values
				for (var i=0; i<len-1; i++)
					htmlcells[i+1].value = prettyname(value.element(i));				
			}
			break;
						
		case 'checkbox':   
			// if undef is false, we have a single true/false box
			// if undef is true, we have multiple boxes
			if (!this.undef)
				htmlcells[0].checked = eval(prettyname(value.element(0))); 
			else
				for (var i=0; i<htmlcells.length; i++)
					htmlcells[i].checked = 
						(value.member(formvalue(htmlcells[0].options[i].value)));
			break; 
	}}

// set GUI element to undefined
cell.prototype.deleteGUI = function() {
	if (this.undef) {
		var htmlcells = document.getElementsByName(this.name);
		switch (this.style) {
			case 'selector': 
				if (this.unique)
					htmlcells[0].options[0].selected = true;
				else
					for (var i=0; i<htmlcells[0].options.length; i++)
						htmlcells[0].options[i].selected = false;
				break;
			case 'radio':  // select =< 1
				if (this.unique)  // undef occurs as item 1
					htmlcells[0].checked = true;
				// radio button is always unique
				break;
			case 'textbox':
				if (this.unique)
					htmlcells[0].value = prettyname(undefined);
				else 
					for (var i=1; i<htmlcells.length; i++)
						remTableRow(htmlcells[i]);
				break;
			case 'checkbox':
				for (var i=0; i<htmlcells.length; i++)
					htmlcells[i].checked = false;
				break;
	}}}


// ghost and bottom need to be synced with Compiler, unfortunately.
cell.prototype.ghost = function() { return this.name + "_ghost"; }
cell.prototype.bottom = function() { return this.name + "_bottom"; }

cell.prototype.multi = function() { return !this.unique; }
cell.prototype.getVal = function() { return this.value; }
cell.prototype.userVal = function () { return !this.disabled && this.userset; }
cell.prototype.hasVal = function () { return !this.disabled && this.value !== undefined; }
cell.prototype.clearConflictset = function () { this.conflictset = new set(); }
cell.prototype.clearForceset = function () { this.forceset = new set(); }
cell.prototype.clearImplied = function () { 
	this.posimplied = new set(); this.negimplied = new set(); }
cell.prototype.disable = function () { 
	this.disabled = true; 
	htmls = document.getElementsByName(this.name);
	for (var i=0; htmls.length; i++) 
		htmls[i].disabled = true; }
cell.prototype.enable = function () { 
	this.disabled = false; 
	htmls = document.getElementsByName(this.name);
	for (var i=0; htmls.length; i++) 
		htmls[i].disabled = false; }

cell.prototype.toString = function() {
		return "cell(name: " + this.name + ", value: " + this.value +  ")"; }

cell.prototype.setPosImplied = function () {
	if (this.possupports !== undefined) this.posimplied = this.possupports('?x'); }

cell.prototype.setNegImplied = function () {
	if (this.negsupports !== undefined) this.negimplied = this.negsupports('?x'); }

cell.prototype.hasStyle = function (htmlstyle, htmltype) {
	htmlstyle = htmlstyle.toLowerCase();
	if (htmltype !== undefined) htmltype = htmltype.toLowerCase();
	switch (this.style) {
		case 'selector': return htmlstyle === 'select';
		case 'radio': return htmlstyle === 'input' && htmltype === 'radio'; 
		case 'checkbox': return htmlstyle === 'checkbox';
		case 'text': return htmlstyle === 'input' && htmltype === 'text'; }
	return false; }

/***************************************************************/
/*************************** Utility ***************************/
/***************************************************************/

// Interface functions for external consumption
function findcell(cell) { return cells[cell]; }
function cellvalue(cell) { return findcell(cell).getVal().element(0); }
function cellvalues(cell) { return findcell(cell).getVal(); }
function hascellvalue(cell) { return cellhasvalue(cell); }
function cellhasvalue(cell) { 
	var obj = findcell(cell);
	return obj.hasVal() && obj.userVal(); }

function remWidgetSlot (cell, obj) {
	remTableRow(obj);
	changeany(cell, true); }
	
function formvalue (value) { 
	if (value === 'undefined') return undefined;
	if (useshortnames) return Number(value);
	else return value; }

function prettyname (value) { 
	if (value === 'undefined') return prettynames[undefined];
	else return prettynames[value]; }

function capitalize (str) {
	str = str.toLowerCase();
	return str.charAt(0).toUpperCase() + str.slice(1); }

function uglyname (value) {
	if (!casesensitive) value = value.toLowerCase();
	if (!(value in uglynames)) { 
		if (useshortnames) v = create_symbol(value);
		else v = value;
		prettynames[v] = value;
		uglynames[value] = v; }
	else v = uglynames[value];
	return v; }		
		
function create_symbol(val) {
	valuecount++;
	return (valuecount-1); }

/******* Support for onSubmit ********/

// remove forced values so server doesn't see them.
function clear_forced_gui () {
	for (var v in cells)
		if (cells.hasOwnProperty(v))
			if (!cells[v].userset) 
				cells[v].deleteGUI(); }

// set all values to prettynames so server only sees pretty names
function set_to_uglynames () {
	for (var v in cells)
		if (cells.hasOwnProperty(v))
			if (cells[v].value !== undefined)
				cells[v].pushGUI(cells[v].value.mapcar(uglyname)); }

function add_hidden(name, value) {
	var node = document.createElement('input');
	node.setAttribute('type','hidden');
	node.setAttribute('name', name);
	node.setAttribute('value', value);
	document.forms[0].elements.push(node); }

function collect_prettynames () {
	var res = '';
	for (var v in prettynames)
		if (prettynames.hasOwnProperty(v))
			res += '(' + v + ' "' + prettynames[v] + '")';
	return "(" + res + ")"; }
		

/******* Generalizing change, focus, mouseover, mouseout events ********/

function changeany(cell, userset) {
	var obj = findcell(cell);
	switch (obj.style) {
		case 'selector': selector_change(cell,userset); break;
		case 'textbox': textbox_change(cell,userset); break; 
		case 'radio': radio_change(cell,userset); break; 
		case 'checkbox': checkbox_change(cell,userset); break; }}

function focusany(cell) {
	var obj = findcell(cell);
	switch (obj.style) {
		case 'selector': selector_focus(cell); break;
		case 'textbox': textbox_focus(cell); break; 
		case 'radio': radio_focus(cell); break; 
		case 'checkbox': checkbox_change(cell); break; }}

function mouseoverany(cell) {
	var obj = findcell(cell);
	switch (obj.style) {
		case 'selector': selector_mouseover(cell); break;
		case 'textbox': textbox_mouseover(cell); break; 
		case 'radio': radio_mouseover(cell); break; 
		case 'checkbox': checkbox_mouseover(cell); break; }}

function mouseoutany(cell) {
	var obj = findcell(cell);
	switch (obj.style) {
		case 'selector': selector_mouseout(cell); break;
		case 'textbox': textbox_mouseout(cell); break; 
		case 'radio': textbox_mouseout(cell); break; 
		case 'checkbox': checkbox_mouseout(cell); break; }}


/************************************************************************/
/*************************** Logical Routines ***************************/
/************************************************************************/

/*************************** Automated Reasoning ***************************/
function update_implied_comp (cell) { findcell(cell).component.mapc(update_implied); }

function update_implied (cell) {
	// alert("updating implied values for " + cell);
	var o = findcell(cell);
	o.setPosImplied();
	o.setNegImplied(); }

/*************************** Value Forcing ***************************/
// Assumes posimplied and negimplied are current

function update_forced_comp (cell) { findcell(cell).component.mapc(update_forced); }

function update_forced (cell) {
	var obj = findcell(cell);
	if (obj.userVal() && obj.hasVal()) {
		return false; }
		
	// if posimplied is empty, no forced values
	if (obj.posimplied.empty())
		{ obj.deleteVal(); return false; }

	// alert("forcing values for " + cell + " +(" + findcell(cell).posimplied + ") -(" + findcell(cell).negimplied + ")");

	// if more than one value is implied and the cell is unique, there is a conflict
	if (obj.unique && obj.posimplied.size() !== 1) 
		{ obj.deleteVal(); return false; }

	// if any value is both positively and negatively entailed, this cell is a conflict.
	//   obj.pos/negimplied is a set of <expr<val>, suppset> pairs 
	if (!obj.posimplied.intersection(obj.negimplied, 
		function(x,y) { return x.first().element(0)===y.first().element(0); }).empty()) {
			obj.deleteVal(); return false; }

	// store the values and the forceset
	obj.value = obj.posimplied.mapcar(function(x) { return x.first().element(0); }).toSet();
	obj.forceset = ds.nunion(obj.posimplied.mapcar(ds.second).toSet());
	return true; }

/*************************** Conflicts ***************************/
// Assumes posimplied and negimplied are current for all cells

function update_conflicts_comp (cell) { findcell(cell).component.mapc(update_conflicts); }
		 
function update_conflicts (cell) {
	var obj = findcell(cell);
	var pos, neg, both, res;
	if (!obj.userVal() || !obj.hasVal()) {
		obj.conflictset = new set();
		return false; }

	//alert("updating conflicts for " + cell + " +(" + findcell(cell).posimplied + ") -(" + findcell(cell).negimplied + ")");
	// find all positively implied that are not selected
	pos = obj.posimplied.difference(obj.value, 
		function(x,y) { return x.first().element(0) === y });
	// find all negatively implied that are selected
	neg = obj.negimplied.intersection(obj.value, 
		function(x,y) { return x.first().element(0) === y });
	// find all values both negatively and positively implied
	both = obj.posimplied.intersection(obj.negimplied,
		function(x,y) { return x.first().element(0) === y.first().element(0) });
	//alert("pos set: " + pos + "; neg set: " + neg);
	// union the sets of support
	res = new set();
	res.nunion(pos.mapcar(ds.second).toSet());
	res.nunion(neg.mapcar(ds.second).toSet());
	res.nunion(both.mapcar(ds.second).toSet());

	// for case when no other cells are to blame
	if (res.empty() && (!pos.empty() || !neg.empty())) res = new set(cell);
	obj.conflictset = res; 
	return true;}

// called during onFocus event
function tooltip_conflicts(cell) {
	var h = build_sfc_hash(cell);
	var s = "";
	for (var v in h) {
			switch (h[v]) {
				case 'c': s += prettyname(v) + " ****\n";  break;
				case 's': s += prettyname(v) + " ++++\n";  break;
				case 'f': s += prettyname(v) + " ----\n";  break; }}
	document.getElementById(cell).title = s; }

function identity (x) { return x; }

function build_sfc_hash (cell) {
	var cellobj = findcell(cell);
/* For when we're not caching implied values
	var negs = cellobj.negs;
	var poss = cellobj.poss;
	var negvalues = new set();
	var posvalues = new set();
	// negs/poss returns a set of expr(v1,...,vn), where n is always 1
	if (negs != undefined) 
		negvalues = negs('?x').mapcar(function(x) { return x.element(0) }).toSet();
	//if (poss != undefined) alert(poss('?x') instanceof set);
	if (poss != undefined) 
		posvalues = poss('?x').mapcar(function(x) { return x.element(0) }).toSet();
*/
	var negvalues = cellobj.negimplied.mapcar(
		function (x) { return x.first().element(0); }).toSet();
	var posvalues = cellobj.posimplied.mapcar(
		function (x) { return x.first().element(0); }).toSet();
	//alert("cell " + cell + "\nnegvalues: " + negvalues + "\nposvalues: " + posvalues);

	// make sets that are mutually exclusive
	var stipulated, forbidden, conflict;
	conflict = posvalues.intersection(negvalues);
	stipulated = posvalues.difference(conflict);
	forbidden = negvalues.difference(conflict);
	var h = {};
	conflict.mapc(function (x) { h[x] = 'c'; });
	stipulated.mapc(function (x) { h[x] = 's'; });
	forbidden.mapc(function (x) { h[x] = 'f'; });
	//alert("Conflicts: " + conflict);
	//alert("Stipulated: " + stipulated);
	//alert("Forbidden: " + forbidden);
	return h; }

function findSelected (select) {
	var res = hashbag();  // use as a set
	for (var i = 0; i < select.options.length; i++) 
		if (select.options[i].selected) 
			res.adjoin(select.options[i].value);
	return res; }


/*************************** Colors ***************************/

function update_gui_comp (cell) { findcell(cell).component.mapc(update_gui); }

function update_gui (cell) {
		var obj = findcell(cell);
		obj.pushGUI();
		update_colors(cell); }
		
function update_colors_comp (cell) { findcell(cell).component.mapc(update_colors); }

function update_colors (cell) {	
		var obj = findcell(cell);
		if (!obj.conflictset.empty()) paintred(cell);
		else if (!obj.forceset.empty()) paintgreen(cell);
		else paintwhite(cell); }

function painttan(cell) { highlight(cell, "#cc9966"); }
function paintbrown(cell) { highlight(cell, "663300"); }
function paintred(cell) { highlight(cell,"red"); }
function paintwhite(cell) { highlight(cell, "white"); }
function paintpurple(cell) { highlight(cell, "purple"); }
function paintgreen(cell) { highlight(cell, "green"); }
function paintyellow(cell) { highlight(cell, "#ffff33"); }


function highlight_supportset (cell) {
	var obj = findcell(cell);
	if (!obj.conflictset.empty()) obj.conflictset.mapc(paintpurple);
	else if (!obj.forceset.empty()) obj.forceset.mapc(paintpurple); }	

function highlight(cell, color) {
	document.getElementById(cell + "box").style.backgroundColor = color; }

function colorAllRed() {
	for (var c in cells) {
		if (cells.hasOwnProperty(c)) {
			highlight(cells[c].name, "red"); }}}

/*************************** Example developer routines ***************************/

// field_update is a routine that has no semantics--it is simply called
//    after the cell updates have all occurred.

var invisible; // remember which ones are hidden
// called once when the form is initialized
function devel_init () {
	 invisible = new set();  
}

// called each time a cell is updated
function devel_update (cell) {
	if (typeof poss_invisible === 'function') {
		var hidden = poss_invisible('?x');
		hidden = hidden.mapcar(function (x) {return prettyname(x.element(0))}).toSet();
		var toshow = invisible.difference(hidden);
		//alert("toshow: " + toshow + "; hidden: " + hidden);
		toshow.mapcar(showcell);
		hidden.mapcar(hidecell);
		invisible = hidden; }}

function hidecell(x) { document.getElementById(getBigBoxName(x)).style.display = 'none'; }
function showcell(x) { document.getElementById(getBigBoxName(x)).style.display = ''; }


/*************************************************************************/
/*************************************************************************/
/*************************** Toplevel Routines ***************************/
/*************************************************************************/
/*************************************************************************/

// initialize spreadsheet and internal datastructures
function initspread (cellarray) {
	var cell;
	for (var i = 0; i < cellarray.length; i++)
		cells[cellarray[i].name] = cellarray[i];
	if (external_init !== undefined) external_init();   // externally initialize form fields
	if (devel_init !== undefined) devel_init(); 
	for (var i = 0; i < cellarray.length; i++) {
		cell = cellarray[i].name;
		update_implied(cell);
		update_forced(cell);
		update_conflicts(cell);
		update_gui(cell); 
		if (devel_update !== undefined) devel_update(cell); }}

/*************************************************************************/
/*************************** Selector Behavior ***************************/
/*************************************************************************/

/************* Focus *************/

function selector_focus(cell) {
	if (allowconflicts == true) {
		if (!findcell(cell).multi())
			selector_setValueStyles_conflicts(cell, build_sfc_hash(cell)); }
	else { 	
		selector_setValueStyles_noconflicts(cell, build_sfc_hash(cell)); }}

// annotate each value with its status (conflict, stipulated, forbidden)
function selector_setValueStyles_conflicts (cell,h) {
	var cellobj = findcell(cell);
	var opt;
	var cellhtml = document.getElementsByName(cellobj.name)[0];
	if (cellhtml.nodeName == 'SELECT') {
		for (var i = 0; i < cellhtml.options.length; i++) {
			opt = cellhtml.options[i];
			selector_setValueStyles_conflicts_opt (opt, h[opt.value]); }}}
		/*
			switch (h[opt.value]) {
				case 'c': opt.text = prettyname(opt.value) + " ****";  break;
				case 's': opt.text = prettyname(opt.value) + " ++++";  break;
				case 'f': opt.text = prettyname(opt.value) + " ----";  break;
				default: opt.text = prettyname(opt.value); }}}} */

function selector_setValueStyles_conflicts_opt (opt, key) {
	switch (key) {
		case 'c': if (fancyoptions) 
					opt.className = "conflict";
				  else
				  	opt.text = prettyname(opt.value) + " ****";  
				  break;
		case 's': if (fancyoptions)
				    opt.className = "stipulated";
				  else
				  	opt.text = prettyname(opt.value) + " ++++";  
				  break;
		case 'f': if (fancyoptions)
				    opt.className = "forbidden";
				  else
				  	opt.text = prettyname(opt.value) + " ----";  
				  break;
		default: if (fancyoptions)
					opt.className = "normal";
				 else
				 	opt.text = prettyname(opt.value); }}

	
// differs because we remove values and perform no annotations
function selector_setValueStyles_noconflicts (cell,h) {
	var cellobj = findcell(cell);
	var cellhtml = document.getElementById(cellobj.name);
	if (cellhtml.nodeName == 'SELECT') {
		var j = 1;  // start with empty 
		var selected = findSelected(cellhtml);		
		// includes nonforbidden values 
		cellobj.type.mapc(function (val) {
			if (h[val] != 'f') {
				cellhtml.options[j] = new Option(prettyname(val), val);
				if (selected.member(val)) 
					cellhtml.options[j].selected = true;
				// debugging
				//opt = cellhtml.options[j];
				//switch (h[cellobj.type[i]]) {
				//	case 'c': opt.text = opt.text + " ****";  break;
				//	case 's': opt.text = opt.text + " ++++";  break; }
				j++; }});
		cellhtml.options.length = j; }}

// mouseover
function selector_mouseover(cell) { mouseover(cell); }

// mouseout
function selector_mouseout(cell) { mouseout(cell); }

// change
function selector_change(cell) {
	// selector_cleanup(cell);  // see below for why we leave this out.
	selector_mouseout(cell);
	update_cell(cell); }

// we don't call either onchange because if a user (a) changes the cell 
//   and (b) without changing focus hits the drop-down list again, 
//   the drop-down action does not retrigger the onfocus event.
// In short, we need a new widget.
function selector_cleanup (cell) {
	var cellhtml = document.getElementById(cell);
	var opt = cellhtml.options[cellhtml.selectedIndex];
	opt.text = prettyname(opt.value);}

function selector_cleanup2 (cell) {
	var cellhtml = document.getElementById(cell);
	var opt;
	for (var i = 0; i < cellhtml.options.length; i++) {
		opt = cellhtml.options[i];
		opt.text = prettyname(opt.value); }}
	
/************************************************************************/
/*************************** Textbox Behavior ***************************/
/************************************************************************/

function textbox_change (cell) {	
	textbox_mouseout(cell);
	update_cell(cell); }
	
function textbox_mouseover(cell) { mouseover(cell); }
function textbox_mouseout(cell) { mouseout(cell); }
function textbox_focus (cell) { }


/*************************************************************************/
/*************************** Checkbox Behavior ***************************/
/*************************************************************************/

function checkbox_change (cell) { 
	checkbox_mouseout(cell);
	update_cell(cell); }

function checkbox_mouseover (cell) { mouseover(cell); }
function checkbox_mouseout (cell) { mouseout(cell); }
function checkbox_focus (cell) { }

/**********************************************************************/
/*************************** Radio Behavior ***************************/
/**********************************************************************/

function radio_change (cell) { 
	radio_mouseout(cell);
	update_cell(cell); }

function radio_mouseover (cell) { mouseover(cell); }
function radio_mouseout (cell) { mouseout(cell); }
function radio_focus (cell) { }

/************************************************************************/
/*************************** Generic Behavior ***************************/
/************************************************************************/

// mouseover
function mouseover(cell) { 
	sendmsg(findcell(cell).conflictset);
	highlight_supportset(cell); }

// mouseout
function mouseout(cell) { 
	update_colors_comp(cell); }

function update_cell(cell) {
	findcell(cell).pullGUI();
	update_implied_comp(cell);
	update_forced_comp(cell);
	update_conflicts_comp(cell);
	update_gui_comp(cell); 
	if (devel_update !== undefined) devel_update(cell); }

/*************************************************************/
/*************************** Scrap ***************************/
/*************************************************************/

// Each time the select box is clicked, the values in that box can be altered
//   to show which values will produce conflicts by calling Clickcell.
//  Version where values are reordered.
/*
function focuscell(cell) {
	var cellobj = findcell(cell);
	var negs = cellobj.negs;
	var poss = cellobj.poss;
	var negvalues = empty();
	var posvalues = empty();
	if (negs != undefined) {
		negvalues = negs(); }
	if (poss != undefined) {
		posvalues = poss(); }
	//alert("neg values: " + negvalues);
	//alert("pos values: " + posvalues);
	
	var goodvalues, badvalues;
	if (posvalues.length == 0) {
		badvalues = negvalues;
		goodvalues = setdiff(cellobj.type, negvalues); }
	else if (posvalues.length == 1) {
		badvalues = setdiff(cellobj.type, posvalues);
		goodvalues = posvalues; }
	else {
		badvalues = cellobj.type;
		goodvalues = empty(); }
		
	setgoodbadcell(goodvalues, badvalues, cellobj); }

function setgoodbadcell(good, bad, cellobj) {
	//alert("Good: " + good);
	var cellhtml = document.getElementById(cellobj.name);
	if (cellhtml.nodeName == 'SELECT') {
		for (var i = 0; i < cellhtml.options.length; i++) {
			if (findq(cellhtml.options[i].value, bad)) {
				cellhtml.options[i].text = cellhtml.options[i].text.toUpperCase() + "****"; }
			else {
				cellhtml.options[i].text = prettyname(cellhtml.options[i].value); }}}}

// Version where we move entries around in select box.  
//  Bug alert: doesn't properly update the selectedIndex property.
function setgoodbadcell2(good, bad, cellobj) {
	//alert("Good: " + good);
	var cellhtml = document.getElementById(cellobj.name);
	if (cellhtml.nodeName == 'SELECT') {
		var cnt = 0;
		// start options list with unknown value
		if (cnt >= cellhtml.options.length) {
			cellhtml.options[cnt] = new Option(); }
		cellhtml.options[cnt].value = '';
		cellhtml.options[cnt].text = '';
		cnt++;
		// then add the good values
		for (var i = 0; i < good.length; i++) {
			if (cnt >= cellhtml.options.length) {
				cellhtml.options[cnt] = new Option(); }
			cellhtml.options[cnt].value = good[i];
			cellhtml.options[cnt].text = prettyname(good[i]);
			cnt++; }
		// then add a separator and the bad values
		if (bad.length > 0) {
			// add in a separator
			if (cnt >= cellhtml.options.length) {
				cellhtml.options[cnt] = new Option(); }
			cellhtml.options[cnt].value = '';
			cellhtml.options[cnt].text = cellobj.separator;
			cnt++;
			// place the bad values at the bottom
			for (var i = 0; i < bad.length; i++) {
				if (cnt >= cellhtml.options.length) {
					cellhtml.options[cnt] = new Option(); }
				cellhtml.options[cnt].value = bad[i];
				cellhtml.options[cnt].text = prettyname(bad[i]);
				cnt++; }}
			cellhtml.options.length = cnt; }}

function buildseparator (type) {
	var s = "";
	var p;
	var max = 0;
	for (var i = 0; i < type.length; i++) {
		p = prettyname(type[i]);
		if (p.length > max) { max = p.length; }}
	for (var i = 0; i < max; i++) {
		s += "-"; }
	return s;}

*/