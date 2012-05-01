
//--------------------------- Basics ---------------------------

//function nth (idx, thing) { return thing[idx]; }

var counter = 0;
function newvar () {counter++; return '?' + counter}
function newsym () {counter++; return 'c' + counter}
function gensym () {counter++; return 't' + counter}
function varp (x) {return stringp(x) && x[0] == '?'}

// support for lisp-style methods
var ds = {
toExpr: function (x) { return x.toExpr(); },
get: function (x,val) { return x.get(val); },
set: function (x,key,val) { return x.set(key,val); },
empty: function (x) { return x.empty(); },
member: function (x,val,test) { return x.member(val,test); },
adjoin: function (x,val,test) { x.adjoin(val,test); return x; },
first: function (x) { return x.first(); },
second: function (x) { return x.second(); },
data: function (x) { return x.data(); },
nunion: function (x) { var s = new set(); s.nunion(x); return s; },
element: function(x,key) { return x.element(key); },
append: function(x,y) { return x.append(y); },
match: function(x,y) { return x.match(y); }
};

//------------------------------- Iteration Interface -------------------------------
// The objects defined here can all be iterated over using one of two interfaces.
//    The first is for objects whose components have no particular ordering.
//    The second is for objects whose components do have a particular ordering.
//
// Iteration (available for both ordered and unordered objects)
//     for (v in obj.data())  // obj.data() gives object over which to iterate
//         obj.element(v)    // gives element represented by v
//
// Ordered iteration
//     for (i=0; i<obj.length(); i++)  // obj.length gives upper index
//         obj.element(i)    // gives element at position i


//------------------------------- Collection Interface -------------------------------
// Most objects defined here are collections of elements and all implement
//   the (ordered) iteration interface.  Collections additionally implement
//   more interesting methods of examining the collection, both as a whole and
//   as a collection of members.
//
//  When iterating over elements
//       for (var key in mybag.data())   // iteration interface
//           mybag.element(key)    // iteration interface
//           mybag.count(key)      //  gives count for iteration interface
//           mybag.count(i)		   //  gives count for ordered iteration interface
//  Given element e
//           mybag.key(e)  // gives key for element e or undefined
//           mybag.member(e)   // check if member
//  Given nothing
//           mybag.empty()  // whether or not elements exist
//           mybag.size()  // number of elements
//           mybag.toString()   // string representation of mybag
//           mybag.getequal() // function for equality testing.
//           mybag.mapc(f)   // apply function f to all elements
//           mybag.mapcar(f) // apply function f to all elements and return results (as tuple)
//           mybag.equal(x) // whether or not x is equal to mybag


//------------------------------- Implementation notes -------------------------------
// Many of the objects defined in this file are based on an array.
// Below we define a fancy versions of the array that supports all of the methods
//   needed for defining later objects.  The later definitions then simply
//   expose a subset of the fancyarray functionality.
// Besides the array, the other objects are based on the hash {}.
// Objects "inheriting" from the hash have a fixed definition for equality of elements.
//   element x is equal to element y iff x.toString() === y.toString();
//   Such objects can always be used to contain primitives, but they should only be used
//   to contain other objects where the toString method uniquely identifies every object.
// Objects based on fancyarray are slower than those based on the hash 
//   but operate on arbitrary objects and admit arbitrary equality definitions for elements.
/*
Implementation comparison (worst case).  
0 indicates constant 
1 indicates hashing on element in collection.
? indicates that speed is dependent on membership of other collection.
n is the size of the collection operated on
m is the size of the collection passed as an argument.

				Array			Hash
data			0				0
element			1				0
count			1				0
key				n				0
empty			0				0
member			n				1

adjoin			n				2
union			n*?				m*2
remove			n				1
intersection	n*?				m*1
difference		n*?				m*1
equal			
*/


//--------------------------- Fancy Array ---------------------------

var fancyarray = function () { 
	this.arr = Array.prototype.slice.apply(arguments); 
	this.memequal = equalp; 
	this.card = this.arr.length; }

fancyarray.prototype.copy = function() {
	var a = new fancyarray();
	a.arr = Array.prototype.slice.apply(this.arr);
	a.memequal = this.memequal;
	a.card = this.card; 
	return a; }

fancyarray.prototype.setequal = function (f) { if (typeof x === 'function') this.memequal = f; }
fancyarray.prototype.getequal = function (f) { return this.memequal; }

fancyarray.prototype.toString = function() { return this.arr.join(); }
fancyarray.prototype.size = function() { return this.card; }
fancyarray.prototype.length = function() { return this.arr.length; }
fancyarray.prototype.data = function() { return this.arr; }
fancyarray.prototype.element = function(v) { return this.arr[v]; }
fancyarray.prototype.count = function(v) {
	if (this.arr[v] !== undefined) return 1; else return 0; }
fancyarray.prototype.key = function(val,test) {
	if (test == undefined) test = this.memequal;
	for (var i in this.arr)
		if (test(this.arr[i],val)) return i;
	return undefined; }
fancyarray.prototype.empty = function() { return this.card === 0; }

fancyarray.prototype.member = function(val, test) {
	return (this.key(val, test) != undefined) }

fancyarray.prototype.equal = function (x,test) {
	if (test === undefined) test = this.memequal;
	if (!(x instanceof fancyarray)) return false;
	if (x.arr.length !== this.arr.length) return false;
	for (var i=0; i<x.arr.length; i++)	
		if (!test(this.arr[i], x.arr[i])) return false;
	return true; }

fancyarray.prototype.equalp = function(x) { return this.equal(x); }

// nondestructive
fancyarray.prototype.mapcar = function (f) {
	var t = new fancyarray();
	for (v in this.arr) 
		if (this.arr[v] != undefined)
			t.append(f(this.arr[v], 1));
	return t; }

// nondestructive
fancyarray.prototype.mapc = function (f) {
	for (v in this.arr) 
		if (this.arr[v] != undefined)
			f(this.arr[v], 1);
	return undefined; }

// destructive
fancyarray.prototype.append = function (val) { this.card++; this.arr.push(val); return this; }

// destructive if val not in array already.
//   if val not in array, puts val in an empty slot, or at end if none.
fancyarray.prototype.adjoin = function (val, test) {
	if (test === undefined) test = this.memequal;
	var freeindex = -1;
	for (var i = 0; i < this.arr.length; i++) {
		if (test(this.arr[i], val)) return this; 
		if (this.arr[i] == undefined) freeindex = i; }
	if (freeindex > -1) this.arr[freeindex] = val;
	else this.arr.push(val);
	this.card++;
	return this; }

// destructive: removes all occurrences of val (according to test)
fancyarray.prototype.remove = function (val, test) {
	var existed = false;
	if (test == undefined) test = this.memequal;
	for (var i=0; i<this.arr.length; i++)
		if ((this.arr[i] != undefined) && test(val,this.arr[i])) {
			delete this.arr[i];
			existed = true;
			this.card--; }
	return existed; }

// destructive
fancyarray.prototype.union = function (collection, test) {
	for (var v in collection.data())
		this.adjoin(collection.element(v),test);
	return this; }

// destructive
// union a set of sets
fancyarray.prototype.nunion = function(collectionofcollections, test) {
	var mythis = this;
	collectionofcollections.mapc(function (coll) { mythis.union(coll, test); });
	return this; }

// nondestructive
fancyarray.prototype.intersection = function (collection, test) {
	var s = new fancyarray;
	for (var i=0; i<this.arr.length; i++)
		if (this.arr[i] != undefined)
			if (collection.member(this.arr[i], finvert(test)))
				s.arr.push(this.arr[i]);
	return s; }

// nondestructive
fancyarray.prototype.difference = function (collection, test) {
	var s = new fancyarray;
	for (var i=0; i<this.arr.length; i++)
		if (this.arr[i] != undefined)
			if (!collection.member(this.arr[i], finvert(test)))
				s.arr.push(this.arr[i]);
	return s; }

// accessing internals of tuple
fancyarray.prototype.toTuple = function() {
	var t = new tuple;
	t.arr = this.copy();
	return t; }

// accessing internals of set
fancyarray.prototype.toSet = function(test) {
	if (test === undefined) test = this.memequal;
	var s = new set;
	s.arr.memequal = test;
	s.union(this);
	return s; }
	
fancyarray.prototype.toPair = function() {
	var p = new pair;
	p.arr = this.copy();
	return p; }
	
fancyarray.prototype.toExpr = function() {
	var e = new expr;
	e.arr = this.copy();
	return e; }

function finvert (f) {
	if (f === undefined) return f;
	else return function(x,y) { return f(y,x); }}

//--------------------------- Function-free Expressions with Matching ---------------------------
// function-free expressions as an array.  Is an ordered-collection.

var expr = function () { 
	this.arr = new fancyarray;
	for (var i=0; i<arguments.length; i++)
		this.arr.append(arguments[i]); }

// collection iteration interface
expr.prototype.setequal = function(f) { return this.arr.setequal(f); }
expr.prototype.getequal = function() { return this.arr.getequal(); }
expr.prototype.toString = function() { return "expr(" + this.arr.toString() + ")"; }
expr.prototype.size = function() { return this.arr.size(); }
expr.prototype.data = function() { return this.arr.data(); }
expr.prototype.element = function(v) { return this.arr.element(v); }
expr.prototype.count = function(v) { return this.arr.count(v); }
expr.prototype.key = function(val,test) { return this.arr.key(val,test); }
expr.prototype.empty = function() { return this.arr.empty(); }
expr.prototype.member = function(val, test) { return this.arr.member(val,test); }
expr.prototype.mapc = function(f) { return this.arr.mapc(f); }
expr.prototype.mapcar = function(f) { return this.arr.mapcar(f).toExpr(); }
expr.prototype.equal = function (x,test) {
	if (!(x instanceof expr)) return false;
	return this.arr.equal(x.arr); }

// ordered-collection iteration interface
expr.prototype.length = function() { return this.arr.length(); }  // for ordered iteration

// match this expression with another.  Return dictionary representing binding list or false.
expr.prototype.equalp = function(x,test) { return this.equal(x,test); }
expr.prototype.match = function(y) { 
	return expr_match(this,y,new dictionary());

	function expr_match (x,y,bl) {
		//alert("expr_match(" + x + ", " + y + ", " + bl + ")");
		if (x === y) return bl;
		if (varp(x)) return expr_matchvar(x,y,bl);
		if (atomicp(x)) if (x === y) return bl; else return false;
		return expr_matchexp(x,y,bl); }

	// matching a variable and something else
	function expr_matchvar (x,y,bl) {
		//alert("expr_matchvar(" + x + ", " + y + ", " + bl + ")");
		var dum = bl.get(x);
		if (dum !== undefined) if (dum === y) return bl; else return false;
		bl.set(x,y); 
		return bl; }

	// matching two expr objects
	function expr_matchexp(x,y,bl) {
		//alert("expr_matchexp(" + x + ", " + y + ", " + bl + ")");
		var m = x.arr.length();
		var n = y.arr.length();  
		if (m != n) return false;
		for (var i=0; i<m; i++) {
			bl = expr_match(x.arr.element(i),y.arr.element(i),bl);
 			if (bl === false) return false; }
		return bl; }
}

//--------------------------- Pair ---------------------------
// An ordered-collection.
function pair(x, y) { this.arr = new fancyarray(x,y); }

// collection iteration interface
pair.prototype.setequal = function(f) { return this.arr.setequal(f); }
pair.prototype.getequal = function() { return this.arr.getequal(); }
pair.prototype.toString = function() { return "pair<" + this.arr.toString() + ">"; }
pair.prototype.size = function() { return 2; }
pair.prototype.data = function() { return this.arr.data(); }
pair.prototype.element = function(v) { return this.arr.element(v); }
pair.prototype.count = function(v) { return this.arr.count(v); }
pair.prototype.key = function(val,test) { return this.arr.key(val,test); }
pair.prototype.empty = function() { return this.arr.empty(); }
pair.prototype.member = function(val, test) { return this.arr.member(val,test); }
pair.prototype.mapc = function(f) { return this.arr.mapc(f); }
pair.prototype.mapcar = function(f) { return this.arr.mapcar(f).toPair(); }
pair.prototype.equal = function (x,test) {
	if (!(x instanceof pair)) return false;
	return this.arr.equal(x.arr); }

// ordered-collection iteration interface
pair.prototype.length = function() { return 2; }  // for ordered iteration

pair.prototype.first = function () { return this.arr.element(0); }
pair.prototype.second = function () { return this.arr.element(1); }
pair.prototype.equalp = function (x,test) { return this.equal(x,test); }
	
/*	
function pair_first (p) { return p.first(); }
function pair_second(p) { return p.second(); }
*/

//--------------------------- Set ---------------------------
//  based on fancyarray

var set = function () { 
	this.arr = new fancyarray;
	for (var i=0; i<arguments.length; i++)
		this.arr.adjoin(arguments[i]); }

// collection iteration interface
set.prototype.setequal = function(f) { return this.arr.setequal(f); }
set.prototype.getequal = function() { return this.arr.getequal(); }
set.prototype.toString = function() { return "set{" + this.arr.toString() + "}"; }
set.prototype.size = function() { return this.arr.size(); }
set.prototype.data = function() { return this.arr.data(); }
set.prototype.element = function(v) { return this.arr.element(v); }
set.prototype.count = function(v) { return this.arr.count(v); }
set.prototype.key = function(val,test) { return this.arr.key(val,test); }
set.prototype.empty = function() { return this.arr.empty(); }
set.prototype.member = function(val, test) { return this.arr.member(val,test); }
set.prototype.mapc = function(f) { return this.arr.mapc(f); }
set.prototype.mapcar = function(f) { return this.arr.mapcar(f).toSet(); }
set.prototype.copy = function() { var s = new set(); s.arr = this.arr.copy(); return s; }

set.prototype.equal = function (x,test) {
	if (!(x instanceof set)) return false;
	return this.difference(x).empty() && x.difference(this).empty(); }

// operations for modifying set
set.prototype.adjoin = function (val, test) { return this.arr.adjoin(val, test); }
set.prototype.remove = function (val, test) { return this.arr.remove(val, test); }
set.prototype.mapcar = function (f) { return this.arr.mapcar(f).toTuple(); }
set.prototype.mapc = function (f) { return this.arr.mapc(f); }
set.prototype.union = function (collection, test) { return this.arr.union(collection, test); }
set.prototype.nunion = function(collofcoll, test) { return this.arr.nunion(collofcoll, test); }
set.prototype.intersection = function (coll, test) {
	return this.arr.intersection(coll,test).toSet();}
set.prototype.difference = function (coll, test) {return this.arr.difference(coll,test).toSet(); }
set.prototype.equalp = function(x, test) { return this.equal(x,test); }
set.prototype.toTuple = function() { return this.arr.toTuple(); }
	

//--------------------------- Tuple ---------------------------
//  based on fancyarray.
//  implements ordered iteration.

var tuple = function () { 
	this.arr = new fancyarray;
	for (var i=0; i<arguments.length; i++)
		this.arr.append(arguments[i]); }

// collection iteration interface
tuple.prototype.tupleequal = function(f) { return this.arr.tupleequal(f); }
tuple.prototype.getequal = function() { return this.arr.getequal(); }
tuple.prototype.toString = function() { return "tuple<" + this.arr.toString() + ">"; }
tuple.prototype.size = function() { return this.arr.size(); }
tuple.prototype.data = function() { return this.arr.data(); }
tuple.prototype.element = function(v) { return this.arr.element(v); }
tuple.prototype.count = function(v) { return this.arr.count(v); }
tuple.prototype.key = function(val,test) { return this.arr.key(val,test); }
tuple.prototype.empty = function() { return this.arr.empty(); }
tuple.prototype.member = function(val, test) { return this.arr.member(val,test); }
tuple.prototype.mapc = function(f) { return this.arr.mapc(f); }
tuple.prototype.mapcar = function(f) { return this.arr.mapcar(f).toTuple(); }
tuple.prototype.equal = function (t, test) {
	if (test === undefined) test = this.memequal;
	if (!(t instanceof tuple)) return false;
	if (!(t.length === this.length)) return false;
	var j=0;
	for (var i=0; i<this.arr.length; i++, j++) {
		if (this.arr[i] === undefined) continue;
		while (t.arr[j] === undefined && j < t.arr.length) j++;
		if (!test(this.arr[i], t.arr[j])) return false; }
	return true; }


// methods for accessing tuples: notice no deletion; hence, tuples 
//    are monotonically increasing data structures.
tuple.prototype.append = function(x) { return this.arr.append(x); }
tuple.prototype.equalp = function(x) { return this.equal(x); }
tuple.prototype.toSet = function(test) { return this.arr.toSet(test); }
tuple.prototype.toExpr = function() { return this.arr.toExpr(); }

tuple.prototype.totalcount = function (x,test) {
	if (test === undefined) test = this.arr.getequal();
	var cnt = 0;
	for (var i in this.arr.data())
		if (test(x,this.arr.element(i))) cnt++;
	return cnt; }


/*
function tuple_cons (x, l) { return list_cons(x,l); }
function tuple_car(l) { return list_car(l); }
function tuple_cdr(l) { return list_cdr(l); }
function tuple_empty(l) { return list_nullp(l); }
function tuple_member(x,l,test) { return list_member(x,l,test); }
function tuple_nreverse (l) { return list_nreverse(l); }

function tuple_mapc (f, tup) { list_mapc(f, tup); }
function tuple_mapcar (f, tup) { return list_mapcar(f, tup); }
function tuple_uniquify (tup) { return list_uniquify(tup); }
function tuple2set (tup, test) { return list2set(tup, test); }
function tuple_first (tup) { return list_car(tup); }
function tuple_rest (tup) { return list_cdr(tup); }
function tuple_acons (x,y,tup) { return list_acons(x,y,tup); }
function tuple_assoc (x,tup) { return list_assoc(x,tup); }
*/



//--------------------------- Dictionary ---------------------------
// Should only be used with object keys if the toString method for the class
//    of objects uniquely identifies the objects.
// Implements unordered iteration with 
//    for (v in dict.data()) dict.element(v) and dict.value(v)
function dictionary() { this.d = {}; }

dictionary.prototype.data = function() { return this.d; }
dictionary.prototype.element = function(v) { return this.d[v]; }
dictionary.prototype.value = function(v) { return this.d[v]; }
dictionary.prototype.key = function(elem,test) { 
	for (var v in this.d)
		if (test(this.d[v].elem, elem)) return v;
	return undefined; }
dictionary.prototype.empty = function() { 
	for (var v in this.d)
		if (v !== undefined) return true;
	return false; }
	
dictionary.prototype.equalp = function(x) { return this.equal(x); }
dictionary.prototype.equal = function (x) {
	if (!(x instanceof dictionary)) return false;
	return objects_equalp(this.d, x.d); }

dictionary.prototype.toString = function () {
	var s = "";
	for (var v in this.d)
		s += this.d[v].elem + ":" + this.d[v].val + ", ";
	return s; }

dictionary.prototype.set = function (key, value) { 
	this.d[key] = {elem: key, val: value}; 
	return true; }
dictionary.prototype.get = function (key) { 
	if (this.d[key] !== undefined) return this.d[key].val;
	else return undefined; }
	
/*
function dict_set(key, val, d) { return d.set(key,val); }
function dict_get(key, d) { return d.get(key); }
*/




//--------------------------- Hashbag ---------------------------
// Implements unordered iteration with
//     for (v in hashbag.data())  hashbag.element(v) and hashbag.count(v)
// Implements Collection interface.
// If elements are objects, toString() must uniquely identify those objects.
//    See introductory notes above.

var hashbag = function () {
	this.d = {};
	this.card = 0;
	for (var i=0; i<arguments.length; i++)
		this.add(arguments[i]); }

// Collection iteration interface
hashbag.prototype.size = function() { return this.card; }
hashbag.prototype.data = function() { return this.d; }			
hashbag.prototype.element = function (v) { return this.d[v].elem; }
hashbag.prototype.empty = function() { return this.card == 0; }
hashbag.prototype.member = function(element) { return (element in this.d); }
hashbag.prototype.mapc = function (f) { for (v in this.d) f(this.d[v].elem, this.d[v].cnt); }
hashbag.prototype.equalp = function(x) { return this.equal(x); }
hashbag.prototype.count = function (v) { 
	var v = this.d[v]; 
	if (v === undefined) return 0;
	else return v.cnt; }

hashbag.prototype.getequal = function () { 
	return function(x,y) { return x.toString() === y.toString(); }}

hashbag.prototype.toString = function () {
	var s = "";
	for (var v in this.d)
		s += this.d[v].elem + "(" + this.d[v].cnt + "), ";
	return "hashbag|" + s + "|"; }

hashbag.prototype.key = function (e) { 
	if ((e != undefined) && (e in this.d)) return e.toString(); else return undefined; }

hashbag.prototype.mapcar = function (f) { 
	var t = new tuple();
	for (v in this.d) t.append(f(this.d[v].elem, this.d[v].cnt));
	return t; }

hashbag.prototype.equal = function(x) {
	if (!(x instanceof hashbag)) return false;
	return this.difference(x).empty() && x.difference(this).empty(); }


// Modification routines
// destructive: add number of copies of element
// The value of d[element] is an object {elem: <...>, cnt: <...>}.  
hashbag.prototype.add = function (element, count) {
	if (count == undefined) count = 1;
	if (this.d[element] == undefined) this.d[element] = {elem: element, cnt: count};
	else this.d[element].cnt += count; 
	this.card += count; }

// destructive: don't increment count--just make sure count is at least 1.
hashbag.prototype.adjoin = function (element) { 
	if (this.d[element] == undefined) {
		this.add(element, 1); 
		return true;}
	return false;}

// destructive: delete val entirely (regardless of count)
hashbag.prototype.expunge = function (val) { 
	if (val != undefined && val in this.d) this.card -= this.d[val].cnt;
	delete this.d[val]; 
	return true; }

// destructive: decrement count of val by one
hashbag.prototype.remove = function (val, count) {
	if (count == undefined) count = 1;
	if (!(val in this.d)) return true;
	if (this.d[val].cnt > count) { this.d[val].cnt -= count; this.card -= count; }
	else this.expunge(val);
	return true; }

// destructive
hashbag.prototype.union = function (collection) {
	for (var i in collection.data()) 
		this.add(collection.element(i), collection.count(i));
	return this; }

// destructive
hashbag.prototype.nunion = function(collectionofcoll) {
	var mythis = this;   // unexpected reference problem
	collectionofcoll.mapc(function (coll) {
		for (var i=0; i<collectionofcoll.count(coll); i++) mythis.union(coll); });
	return this; }
	
// destructive
hashbag.prototype.setunion = function (collection) {
	var mythis = this;  // unexpected reference problem
	collection.mapc(function(elem) { mythis.adjoin(elem); });
	return this; }

// non-destructive
// Note: not all collections have count implemented
hashbag.prototype.intersection = function (collection) {
	var b = new hashbag;
	var e;
	for (v in collection.data()) {
		e = collection.element(v);
		if (e in this.d) {
			b.add(e, Math.min(collection.count(v), this.d[e].cnt)); }}
	return b; }
	
// non-destructive
// Note: not all collections have count implemented
hashbag.prototype.difference = function (collection) {
	var b = new hashbag();
	var eobj, key, keycnt;
	for (v in this.d) {
		eobj = this.d[v];
		key = collection.key(eobj.elem);
		if (key !== undefined) {
			keycnt = collection.count(key);
			if (eobj.cnt > keycnt)
				b.add(eobj.elem, eobj.cnt - keycnt); }
		else
			b.add(eobj.elem, eobj.cnt); }
	return b; }



// 1. NEED TO MAKE TUPLE OBJECT ORIENTED (and implement collection interface)
// 2. THEN FOLD THESE CHANGES INTO COMPILER AND WEBSHEET.JS.
//    (USE SET FOR ALL EXTENSIONAL TABLES EXCEPT FOR UNIV, AND USE SET FOR FINDS/P/SUPPS/...
// 3. THEN MAKE TEXTFIELD ONCHANGE INCLUDE UPDATES TO UNIV TYPE.
// 4. REMOVE DUPLICATE STORAGE OF TYPES (VIA DICTIONARY AND JAVASCRIPT ARRAYS).
// 5. ADD IN BOOLEAN TYPE AND CHECKBOX DISPLAY.
// 6. ADD FORCING CODE TO WEBSHEET.JS.
// 7. IMPLEMENT SHIPPING/BILLING ADDRESS EXAMPLE.





//--------------------------- Testing ---------------------------


// Run the following code after loading the ds.js and util.js
//  The result is an array with the names of the tests that failed.
// Note that we don't test fancyarray; rather, we test the objects that
//   use it.  Should eventually add tests for fancyarray as well.

function clearmsg() { document.getElementById('msg').value = ""; }
function appendmsg(m) { document.getElementById('msg').value += m; }

function findbugs() {
var probs = [];
function test (desc, val1, val2) {
  if (val1 != val2) {
  	probs.push(desc);
  	appendmsg(desc + " Failed\n"); }
  else appendmsg(desc + " Succeeded\n");
}
d = {};
for (var v in d) alert(v + d[v]);

var b = new hashbag(1,2,1);
b.add("a");
b.add("cat", 3);
b.add(7);

var b2 = new hashbag(1,1,2,"a","cat","cat","cat",7);
test("bag0", b2.equal(b), true);
b2.remove("cat");
test("bag0.5", b2.equal(b), false);

test("bag1", b.member("a"), true);
test("bag2", b.member(7), true);
test("bag3", b.member("b"), false);
test("bag4", b.member(8), false);
test("bag5", b.count("cat"), 3);
test("bag6", b.count(1), 2);
test("bag7", b.element("cat"), "cat");
test("bag8", b.element(1), 1);
test("bag8.5", b.key(1), 1);

b2 = new hashbag(1,3,"cat","dog");
b.union(b2);
test("bag9", b.count(1), 3);
test("bag10", b.member("dog"), true);

b.adjoin(1);
b.adjoin(17);
test("bag11", b.count(1), 3);
test("bag12", b.member(17), true);

b2 = new hashbag(1,3)
b.setunion(b2);
test("bag13", b.count(1), 3);
test("bag14", b.count(3), 1);
test("bag15", b.count(97), 0);

b.remove(1);
b.expunge("cat");
test("bag16", b.count(1), 2);
test("bag17", b.count("cat"), 0);
test("bag18", b.d["cat"], undefined);
test("bag18.5", b.expunge("house"), true);  // check if throws error

b2 = new hashbag(1,1,2,"a",7,3,"dog",17);
test("bag19", b.equal(b2), true);
b2.remove(1);
test("bag20", b.equal(b2), false);

b2 = new hashbag(1,2,3);
b2 = b.difference(b2);
var b3 = new hashbag(1,"a",7,"dog",17);
test("bag21", b3.equal(b2), true);

b2 = new hashbag(1,1,"dog",17,97,"alpha");
b2 = b2.intersection(b);
b3 = new hashbag(1,1,"dog",17);
test("bag22", b2.equal(b3), true);


var c1 = [1,2,3];
var c2 = [4,5,6];
b2.add(c1);
b2.add(c2);
test("bag23", b2.count([1,2,3]), 1);
test("bag24", b2.member([7,8,9]), false);
b2.adjoin(c1);
test("bag25", b2.count([1,2,3]), 1);
b2.add([1,2,3]);
test("bag26", b2.count([1,2,3]), 2);
test("bag27", equalp(b2.element([1,2,3]),[1,2,3]), true);
b2.remove([1,2,3]);
test("bag28", b2.count([1,2,3]), 1);
b2.expunge([4,5,6]);
test("bag29", b2.count([4,5,6]), 0);

c1 = new hashbag([1,2,3], [4,5,6], [4,5,6]);
b2.union(c1);
b3 = new hashbag([1,2,3],[1,2,3],[4,5,6],[4,5,6],1,1,"dog",17);
test("bag30", b2.equal(b3), true);

var c2 = c1.mapcar(function(arr,cnt) { return cnt*eval(arr.join("+"));})
test("bag31", c2.equal(new tuple(6, 30)), true);

var s = new set("a", 7, {x:1, y:2}, 8, 8);
test("set1", s.member("a"), true);
test("set2", s.member(8), true);
test("set3", s.size(), 4);
test("set4", s.member({x:1, y:2}), true);
test("set5", s.count(s.key(8)), 1)

s.remove({x:1, y:2});
s.adjoin({x:3, y:4});
test("set6", s.member({x:1, y:2}), false);
test("set7", s.size(), 4);

var s2 = new set(8,9,{x:3, y:4});
s2.union(s);
test("set8", s2.equal(new set("a",7,8,9,{x:3, y:4})), true);

s = new set("a",7,{x:3,y:4},8);
s2 = new set(8,9,{x:3,y:4});
var s3 = s.intersection(s2);
test("set9", s3.equal(new set(8,{x:3,y:4})), true);
s3 = s.difference(s2);
test("set10", s3.equal(new set("a",7)), true);

var t10 = s2.mapcar(function(x) { if (numberp(x)) return 2*x; else return 0; });
test("set11", t10.equal(new tuple(16,18,0)), true);

t10 = s2.toTuple();
test("set12", t10.equal(new tuple(8, 9, {x:3, y:4})), true);

var d = new dictionary();
d.set(1,2);
d.set(2,3);
d.set(2,4);
test("dict1", d.get(2), 4);

var d2 = new dictionary();
d2.set(1,2);
d2.set(2,4);
test("dict2", d2.equal(d), true);

var e = new expr("p", "a", "a", "b");
var e2 = new expr("p", "?x", "?x", "?y");
d = new dictionary();
d.set("?x", "a");
d.set("?y", "b");
d2 = e.match(e2);
test("expr1", d.equal(d2), false);
d2 = e2.match(e);
test("expr2", d.equal(d2), true);

var t = new tuple(1,2,1,{x:1, y:2});
t.append("a");

test("tuple1", t.member(2), true);
test("tuple2", t.member("a"), true);
test("tuple3", t.member({x:1, y:2}), true);
test("tuple4", t.count(1), 1);
test("tuple4.5", t.totalcount(1), 2);
test("tuple5", t.element(2), 1);
test("tuple6", t.size(), 5);
test("tuple7", t.empty(), false);
test("tuple8", t.key(1), 0);

t = new tuple(1,2,1,"horse","a");
var t2 = t.mapcar(function(x) { if (numberp(x)) return x*x; else return x; });
test("tuple9", t2.equal(new tuple(1,4,1,"horse", "a")), true);

t2 = t.toSet();
test("tuple10", t2.equal(new set(1,2,"horse", "a")), true);

s = new set(new pair(new expr(4), new tuple(1,2,3)))
d = new set(1,2,3,4)
test("complexset1", d.difference(s, function(x,y) { return x === y.first().element(0); }).equal(new set(1,2,3)), true);

if (probs.length === 0) return "Passed all tests"; 
else return "Failed tests: " + probs;

}


/*
//--------------------------- HashBag (old) ---------------------------

// the value of d[v] is an object {elem: <...>, cnt: <...>}.  
//  allows us to store well-behaved objects as well as primitives.
var hashbag = function () {
	this.d = {};
	this.card = 0;
	this.memequal = function(x,y) { return x.toString() === y.toString(); };
	for (var i=0; i<arguments.length; i++)
		this.add(arguments[i]); }

hashbag.prototype.toString = function () {
	var s = "";
	for (var v in this.d)
		s += this.d[v].elem + "(" + this.d[v].cnt + "), ";
	return "hashbag(" + s + ")"; }

hashbag.prototype.size = function() { return this.card; }
hashbag.prototype.data = function() { return this.d; }			
hashbag.prototype.element = function (v) { return this.d[v].elem; }
hashbag.prototype.count = function (v) { 
	var v = this.d[v]; 
	if (v == undefined) return 0;
	else return v.cnt; }

// returns undefined if element does not exist
hashbag.prototype.key = function (e) { 
	if ((e != undefined) && (e in this.d)) return e.toString(); else return undefined; }

hashbag.prototype.empty = function() { return this.card == 0; }
	
hashbag.prototype.member = function(element) { return (element in this.d); }

// destructive: 
//   add number of copies of element to bag
hashbag.prototype.add = function (element, count) {
	if (count == undefined) count = 1;
	if (this.d[element] == undefined) this.d[element] = {elem: element, cnt: count};
	else this.d[element].cnt += count; 
	this.card += count; }

// destructive: don't increment count--just make sure count is at least 1.
hashbag.prototype.adjoin = function (element) { 
	if (this.d[element] == undefined) {
		this.add(element, 1); 
		return true;}
	return false;}

// destructive: delete val entirely (regardless of count)
hashbag.prototype.expunge = function (val) { 
	if (val != undefined && val in this.d) this.card -= this.d[val].cnt;
	delete this.d[val]; 
	return true; }

// destructive: decrement count of val by one
hashbag.prototype.remove = function (val, count) {
	if (count == undefined) count = 1;
	if (!(val in this.d)) return true;
	if (this.d[val].cnt > count) { this.d[val].cnt -= count; this.card -= count; }
	else this.expunge(val);
	return true; }

// non-destructive
hashbag.prototype.mapc = function (f) { for (v in this.d) f(this.d[v].elem); }

// non-destructive
hashbag.prototype.mapcar = function (f) { 
	var t = new tuple();
	for (v in this.d) t.append(f(this.d[v].elem, this.d[v].cnt));
	return t; }

// destructive: modifies first set
// Note: using collection interface so a bag will union with a set, a tuple, etc.
hashbag.prototype.union = function (collection) {
	for (var i in collection.data()) this.add(collection.element(i), collection.count(i));
	return this; }

// destructive
hashbag.prototype.nunion = function(collectionofcoll) {
	collectionofcoll.mapc(function (coll) {
		for (var i=0; i<collectionofcoll.count(coll); i++) this.union(coll); });
	return this; }
	
// destructive
hashbag.prototype.setunion = function (collection) {
	for (var i in collection.data()) this.adjoin(collection.element(i));
	return this; }

// non-destructive
hashbag.prototype.intersection = function (collection) {
	var b = new hashbag;
	var e;
	for (v in collection.data()) {
		e = collection.element(v);
		if (e in this.d)
			b.add(e, Math.min(collection.count(v), this.d[e].cnt)); }
	return b; }
	
// non-destructive
hashbag.prototype.difference = function (collection) {
	var b = new hashbag();
	var eobj, key, keycnt;
	for (v in this.d) {
		eobj = this.d[v];
		key = collection.key(eobj.elem);
		if (key != undefined) {
			keycnt = collection.count(key);
			if (eobj.cnt > keycnt)
				b.add(eobj.elem, eobj.cnt - keycnt); }
		else
			b.add(eobj.elem, eobj.cnt); }
	return b; }

// non-destructive: equal only holds if both are bags.
hashbag.prototype.equal = function(bag) {
	if (!(bag instanceof hashbag)) return false;
	return this.difference(bag).empty() && bag.difference(this).empty(); }

hashbag.prototype.equalp = hashbag.prototype.equal;
*/


//--------------------------- List (deprecated) ---------------------------
//  Keep around for a rainy day.
/*
function list2set (l, test) { 
	var s = set(); 
	list_mapc(function(x) { set_adjoin(x, s, test); }, l); 
	return s; }

var nil = 'nil';

var list = function () {
	var l = nil;
	for (var i=0; i<arguments.length; i++) {
		l = cons(arguments[i], l);
	}
	return nreverse(l); }

function list_cons (x,l)
 {var cell = [x, l];
  return cell}

function list_car (l)
 {if (list_nullp(l)) return nil; else return l[0];}

function list_cdr (l)
 {if (list_nullp(l)) return nil; else return l[1]}

function list_nullp (l)
 {return l == nil}

function list_len (l)
 {var n = 0;
  for (var m = l; m != nil; m = list_cdr(m)) {n = n+1};
  return n}

function list_member (x,l,test)
 {if (test == undefined) test = eq;
  if (list_nullp(l)) {return false;}
  if (test(list_car(l), x)) {return true;}
  if (list_member(x,list_cdr(l),test)) {return true;}
  return false;}

function list_mapc (f, l) {
	for(var e = l; e != nil; e = list_cdr(e)) 
		{ f(list_car(e)); }}
	 
function list_mapcar (f, l) {
	var n = nil;
	for(var e = l; e != nil; e = list_cdr(e)) 
		{ n = list_cons(f(list_car(e)), n); }
	return list_nreverse(n); }

function list_some(test, l) {
	for (var e = l; e != nil ; e = list_cdr(e)) {
		if (test(list_car(e))) { return true; }}
	return false; }

function list_uniquify (tup, test) {
	var s = set();
	for (var i = tup; i != nil; i = list_cdr(i)) {
		set_adjoin(list_car(i), s, test); }
	return set2tuple(s); }

function list_acons (x,y,al)
 {return list_cons(pair(x,y),al)}

function list_assoc (x,al)
 {if (list_nullp(al)) {return false};
  if (x == pair_first(list_car(al))) {return list_car(al)};
  return list_assoc(x,list_cdr(al))}

function list_nreverse (l)
 {if (list_nullp(l)) {return nil}
  else {return list_nreversexp(l,nil)}}

function list_nreversexp (l,ptr)
 {if (list_cdr(l) == nil) {l[1] = ptr; return l}
  else {var rev = list_nreversexp(cdr(l),l);
        l[1] = ptr;
        return rev}}

function list_delet(item, l, test) {
	if (test == undefined) { test = eq; }
	if (list_nullp(l)) { return l; }
	else {
		// destructively remove item from cdr of list 
		var prev = l;
		for (var it = list_cdr(l); !list_nullp(it); it = list_cdr(it)) {
			if (test(list_car(it), item)) { prev[1] = list_cdr(it); }
			else { prev = it; }}
		// check the first item
		if (test(list_car(l), item)) { return list_cdr(l); }
		else { return l; }}}
*/

//----------------------- Scrap code -----------------------

/*
function newvar ()
 {counter++;
  return 'V' + counter}

function newsym ()
 {counter++;
  return 'c' + counter}

//------
function empty ()
 {return new Array(0)}

function seq ()
 {var exp=new Array(arguments.length);
  for (var i=0; i<arguments.length; i++) {exp[i]=arguments[i]};
  return exp}

function rest (l)
 {var m  = l.slice(1,l.length);
  return m}

function findq (x,s)
 {for (var i=0; i<s.length; i++) {if (x == s[i]) {return true}};
  return false}

function find (x,s)
 {for (var i=0; i<s.length; i++) {if (equalp(x,s[i])) {return true}};
  return false}

function append (l1,l2)
 {var m  = l1.concat(l2);
  return m}

function concatenate (l1,l2)
 {var m  = l1.concat(l2);
  return m}

function subst (x,y,z)
 {if (z == y) {return x};
  if (symbolp(z)) {return z};
  var exp = new Array(z.length);
  for (var i=0; i<z.length; i++)
      {exp[i] = subst(x,y,z[i])}
  return exp}

function substitute (p,q,r)
 {if (symbolp(r)) {if (r == p) {return q} else {return r}};
  var exp = empty();
  for (var i=0; i<r.length; i++)
      {exp[exp.length] = substitute(p,q,r[i])};
  if (equalp(exp,p)) {return q} else {return exp}}

function substitutions (p,q,r)
 {if (symbolp(r)) {if (r == p) {return seq(r,q)} else {return seq(r)}};
  return substitutionsexp(p,q,r,0)}

function substitutionsexp (p,q,r,n)
 {if (n == r.length) {return seq(empty())};
  var firsts = substitutions(p,q,r[n]);
  var rests = substitutionsexp(p,q,r,n+1);
  var results = empty();
  for (var i=0; i<firsts.length; i++)
      {for (var j=0; j<rests.length; j++)
           {exp = seq(firsts[i]).concat(rests[j]);
            results[results.length] = exp;
            if (equalp(exp,p)) {results[results.length] = q}}}
  return results}

*/

