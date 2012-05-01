/******************************************************************/
/*************************** Javascript ***************************/
/******************************************************************/

function stringp (x) { return typeof x == 'string'; }
function numberp(x) { return typeof(x) == 'number'; }
function booleanp(x) { return typeof(x) == 'boolean'; }
function functionp(x) { return typeof(x) == 'function'; }
function objectp(x) { return typeof(x) == 'object'; }
function atomicp(x) { x=typeof(x); return x=='string' || x=='number' || x=='boolean'; }


function eq (p,q) { return p === q; }
function eql (p,q) { return p == q; }

function equalp (x,y) {
	if (x === y) return true;   // primitives
	if (functionp(x) || functionp(y)) return false;  // functions
	if (objectp(x) && objectp(y))
  		if (x.equalp === undefined) 
  			if (y.equalp === undefined) return objects_equalp(x,y);
  			else return y.equalp(x);
  		else return x.equalp(y);
	return false; }

/*
function arrays_equalp(x, y) {
	if (!(x instanceof Array) || !(y instanceof Array)) return false;
	if (x.length != y.length) return false;
	for (var i=0; i<x.length; i++)
		if (!equalp(x[i],y[i])) return false;
	return true; }
*/

function objects_equalp(x,y) {
	if (!objectp(x) || !objectp(y)) return false;
	for (var v in x)
		if (!(v in y) || !equalp(x[v], y[v])) return false;
	for (var v in y)
		if (!(v in x) || !equalp(x[v], y[v])) return false;
	return true; }


function timeit (f) {
	var v1 = new Date();
	f();
	var v2 = new Date();
	v2 = v2.getTime() - v1.getTime();
	return v2; }

function ms2str (ms) {
	if (ms < 1000)
		return ms + " milliseconds";
	else if (ms < 60*1000)
		 return (ms/1000 + " seconds");
	else if (ms < 3600*1000)
		return (ms/60000 + " minutes");
	else
		return (ms/3600000 + " hours"); }

	
function thing2str (thing) {
   if (typeof thing == 'object') return obj2str(thing);
   return "" + thing; }

function obj2str (obj) {
  var s = "{"
  for (var v in obj) {
    if (typeof v == 'object') s += obj2str(v);
    else s += v;
    s += ":";
    if (obj[v] == null)  { s += v; }
    else if (typeof obj[v] == 'object') { s += obj2str(obj[v]);}
    else { s += obj[v]; }
    s += ", "; }
  s += "}";
  return s; }
  
 function print (x) { alert(thing2str(x)); return x; }


/**********************************************************************/
/*************************** DOM Operations ***************************/
/**********************************************************************/

function submitOnEnter(e, formname) {
  var keynum;
  if (window.event) {keynum = e.keyCode;}
  else if (e.which) {keynum = e.which;}
  if (keynum == 13) {  
  	submit(formname);
    return false; }
  else { return true; }}
  
function submit(formname) {
	document.getElementById(formname).submit(); }

function setValue(objname, val) {
	document.getElementById(objname).value = val; }
	
function copyValue(textbox, selectbox) {
	var selectobj = document.getElementById(selectbox);
	var item = selectobj.options[selectobj.selectedIndex].value;
	document.getElementById(textbox).value = item; 
	if (selectobj.selectedIndex > 0) return true;
	else return false; }

function addTableRow (rowtocopy,obj) {
	var node = obj.parentNode.parentNode;
	var copy = document.getElementById(rowtocopy).cloneNode(true);
	node.parentNode.insertBefore(copy,node);
	//copy.setAttribute('qualifier','active');
	copy.id = "";
	copy.style.display = '';
	enableall(copy);
	return true; }

function remTableRow (obj) {
	var node = obj.parentNode.parentNode;
	node.parentNode.removeChild(node);
	return true; }

function enableall (obj) {
	if (obj.disabled !== undefined) obj.disabled = false; 
	if (obj.childNodes !== undefined)
		for (var i=0; i<obj.childNodes.length; i++)
			enableall(obj.childNodes[i]); }

function inside (obj, id) {
	if (obj.id === id) return true;
	if (obj.parentNode === null) return false;
	return inside(obj.parentNode, id); }

/**************************************************************************/
/*************************** Debugging with DOM ***************************/
/**************************************************************************/

function sendmsg(x) {
	var msgbox = document.getElementById('msg');
	if (msgbox !== null) msgbox.value = x; }

function alerteval (box) {
	alert(eval(document.getElementById(box).value)); }

function alerttime (box) {
	alert(ms2str(timeit(function () {eval(document.getElementById(box).value);}))); }

function queryp(pbox, thbox) {
	rulebase = readdata(document.getElementById(thbox).value);
	var q = read(document.getElementById(pbox).value);
	alert(findp(q));}

function queryx(pbox, thbox) {
	rulebase = readdata(document.getElementById(thbox).value);
	var q = read(document.getElementById(pbox).value);
	var res = findx(q,q);
	alert("raw: " + res);
	alert(grind(res));}

function queryproofx(pbox, thbox) {
	rulebase = readdata(document.getElementById(thbox).value);
	var q = read(document.getElementById(pbox).value);
	var res = findsupportx(q,q);
	if (res != false) {
	   alert("Answer: " + grind(res[0]));
	   alert("Proof: " + grindproof(res[1])); }
	else { alert(res); }}

function querys(pbox, thbox) {
	rulebase = readdata(document.getElementById(thbox).value);
	var q = read(document.getElementById(pbox).value);
	alert(amapcar(grind,finds(q, q)));}

function queryproofs(pbox, thbox) {
	rulebase = readdata(document.getElementById(thbox).value);
	var q = read(document.getElementById(pbox).value);
	var res = findsupports(q,q); 
	if (res != false) {
	   alert("Answer: " + amapcar(grind, res[0]));
	   alert("Proof: " + amapcar(grindproof, res[1])); }
	else { alert(res); }}

function conflicts (pbox) {
	var cell = document.getElementById(pbox).value;
	var cellobj = findcell(cell);
	if (cellobj == undefined) { alert("Unknown cell: " + cell); return; }
	alert(cellobj.conflictset); }
