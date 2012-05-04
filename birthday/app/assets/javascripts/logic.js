//------------------------------------------------------------------------------
// findval
//------------------------------------------------------------------------------

function findval (query)
 {if (symbolp(query)) {return findvalsymbol(query)};
  if (query[0] == 'and') {return findvaland(query)};
  if (query[0] == 'or') {return findvalor(query)};
  if (query[0] == 'if') {return findvalif(query[1],query[2],query[3])};
  if (query[0] == 'cases') {return findvalcases(query)};
  var args = empty();
  for (var i=1; i<query.length; i++) {args[i] = findval(query[i])};
  return findvalcall(query[0],args)}

function findvalsymbol (query)
 {if (query == 'true') {return 'true'};
  if (findq(query,inputs)) {return findinputvalue(query)};
  if (findq(query,outputs)) {return findoutputvalue(query)};
  return query}

function findinputvalue (cellname)
 {var cell = document.getElementById(cellname);
  return cell.options[cell.selectedIndex].dbval}

function findoutputvalue (cellname)
 {for (var i=0; i<definitions.length; i++)
      {if (definitions[i][1] == cellname) {return findval(definitions[i][2])}};
  return false}

function findvaland (query)
 {for (var i=1; i<query.length; i++)
      {if (findval(query[i]) == false) {return false}};
  return true}

function findvalor (query)
 {for (var i=1; i<query.length; i++)
      {if (findval(query[i]) == true) {return true}};
  return false}

function findvalif (p,x,y)
 {if (findval(p) == true) {return findval(x)} else {return findval(y)}}

function findvalcases (query)
 {for (var i=1; i<query.length; i=i+2)
      {if (i == query.length-1) {return findval(query[i])};
       if (findval(query[i]) == true) {return findval(query[i+1])}}
  return false}

function findvalcall (fun,args)
 {if (fun == 'same') {if (args[1]==args[2]) {return true} else {return false}};
  if (fun == 'distinct') {if (args[1]!=args[2]) {return true} else {return false}};
  args[0] = fun;
  return args}

//------------------------------------------------------------------------------
// findp, findx, finds
//------------------------------------------------------------------------------

var database = new Array();
var rulebase = new Array();
var thing;
var answer;
// TLH: added variable answers, support, supports
var answers;
var support;
var supports;

// TLH: added argument bl
function findp (query,bl)
 {return findx('true',query,bl)}

// TLH: added argument bl
function findx (result,query,bl)
 {if (bl == undefined) { bl = nil; }
  thing = result;
  answer = false;
  if (proone(query,empty(),bl)) {return answer};
  return false}

// TLH: added
function findsupportx (result,query,bl)
 {if (bl==undefined) { bl=nil; }
  thing = result;
  answer = false;
  support = nil;
  if (proonesupp(query,empty(),bl,nil)) {return new Array(answer, support)};
  return false}

// TLH: changed answer to answers and added bl arg
function finds (result,query,bl)
 {if (bl == undefined) { bl = nil; }
  thing = result;
  answers = empty();
  proall(query,empty(),bl);
  //alert("finds answers: " + answers);
  return answers}

// TLH: added
function findsupports (result,query,bl)
 {if (bl==undefined) { bl=nil; }
  thing = result;
  answers = empty();
  supports = empty();
  proallsupp(query,empty(),bl,nil);
  //alert("findsupports answer: " + answers + " ;;;;; " + supports);
  if (answers.length == 0) { return false; }
  return new Array(answers, supports); }

//------------------------------------------------------------------------------


function print (x, msg) { alert(msg + " " + x); return x }

// TLH: Added attachment for cell
function proone (p,pl,al)
 {//alert("proone(" + p + ';' + pl + ';' + al + ")");
  if (symbolp(p)) {return prooners(p,pl,al)}
  if (p[0] == 'not') {return proonenot(p,pl,al)}
  if (p[0] == 'and') {return prooneand(p,pl,al)}
  if (p[0] == 'or') {return prooneor(p,pl,al)}
  if (p[0] == 'same') {return proonesame(p,pl,al)}
  if (p[0] == 'distinct') {return proonedistinct(p,pl,al)}
  if (p[0] == 'cell') {return proonecell(p,pl,al)}
  return prooners(p,pl,al)}

function proonenot (p,pl,al)
 {if (proone(p[1],empty(),al) == false) {return prooneexit(pl,al)}
  return false}

function prooneand (p,pl,al)
 {return prooneexit(append(rest(p),pl),al)}

function prooneor (p,pl,al)
 {var bl;
  for (var i=0; i<p.length; i++)
      {if (bl == proone(p[i],pl,al)) {return true}}
  return false}

function proonesame (p,pl,al)
 {al = unify(p[1],p[2],al);
  if (al != false) {return prooneexit(pl,al)};
  return false}

function proonedistinct (p,pl,al)
 {if (unify(p[1],p[2],al) == false) {return prooneexit(pl,al)};
  return false}

// TLH: Added
function proonecell(p,pl,al)
 {// if the cell doesn't have a value, someone has applied this code incorrectly.
  // if (!cellhasvalue(p[1])) { return false; }
  var bl = unify(cellvalue(p[1]), p[2], al);
  if (bl != false) {return prooneexit(pl,bl)};
  return false}
  
function prooners (p,pl,al)
 {var copy;
  var bl;
  for (var i=0; i<rulebase.length; i++)
      {copy = standardize(rulebase[i]);
       if (copy[0] == 'rule')
          {bl = unify(copy[1],p,al);
           if (bl != false && proone(copy[2],append(copy.slice(3),pl),bl)) {return true}}
       else {bl = unify(copy,p,al);
             if (bl != false && prooneexit(pl,bl)) {return true}}};
  return false}

function prooneexit (pl,al)
 {//alert("prooneexit(" + pl + ";" + al + ")");
  if (pl.length != 0) {return proone(pl[0],rest(pl),al)};
  answer = plug(thing,al);
  return true}

//------------------------------------------------------------------------------

// TLH: Added entire procedure: only extensional tables, and query is ands and ors of literals
//     that obey the usual safety property: a negative literal and an attached literal is
//     always ground by evaluation time, ordered from left to right. Find one answer/proofs.

function proonesupp (p,pl,al,pf)
 {//alert("proonesupp(" + grind(p) + ';' + pl + ';' + al + ";" + pf + ")");
  if (symbolp(p)) {return proonesupprs(p,pl,al,pf)}
  if (p[0] == 'not') {return proonesuppnot(p,pl,al,pf)}
  if (p[0] == 'and') {return proonesuppand(p,pl,al,pf)}
  if (p[0] == 'or') {return proonesuppor(p,pl,al,pf)}
  if (p[0] == 'cell') {return proonesuppcell(p,pl,al,pf)}
  return proonesupprs(p,pl,al,pf)}

function proonesuppnot (p,pl,al,pf)
 {//alert("proonesuppnot(" + p + ';' + pl + ';' + al + ';' + pf + ")");
  if (proonesupp(p[1],empty(),al,nil) == false) { return proonesuppexit(p,pl,al,pf); }
  return false}

function proonesuppand (p,pl,al,pf)
 {return proonesuppexit(nil,append(rest(p),pl),al,pf)}

function proonesuppor (p,pl,al,pf)
 {for (var i=1; i<p.length; i++)
      {if (proonesupp(p[i],pl,al,pf) == true) {return true}}
  return false}

function proonesuppcell(p,pl,al,pf)
 {//alert("proonesuppcell(" + p + ';' + pl + ';' + al + ';' + pf + ")");
  var bl = unify(cellvalue(p[1]), p[2], al);
  if (bl != false) {return proonesuppexit(p,pl,bl,pf)};
  return false}

function proonesupprs (p,pl,al,pf)
 {var copy;
  var bl;
  for (var i=0; i<rulebase.length; i++)
      {copy = standardize(rulebase[i]);
       if (copy[0] == 'rule')
          {bl = unify(copy[1],p,al);
           if (bl != false && proonesupp(copy[2],append(copy.slice(3),pl),bl,pf)) {return true}}
       else {bl = unify(copy,p,al);
             if (bl != false && proonesuppexit(p,pl,bl,pf)) {return true}}};
  return false}

function proonesuppexit (p,pl,al,pf)
 {//alert("proonesuppexit(" + grind(p) + ';' + pl + ';' + al + ';' + pf + ")");
  if (pl.length != 0) {
     if (nullp(p)) { return proonesupp(pl[0],rest(pl),al,pf); }
     else { return proonesupp(pl[0],rest(pl),al,cons(cons(p,al),pf)); }}
  answer = plug(thing,al);
  if (nullp(p)) { support = pf; }
  else { support = cons(cons(p,al),pf); }
  return true}

//------------------------------------------------------------------------------

// TLH: Added attachment for cell
function proall (p,pl,al)
 {//alert(grind(p) + '-' + pl + '-' + al);
  if (symbolp(p)) {return proallrs(p,pl,al)}
  if (p[0] == 'not') {return proallnot(p,pl,al)}
  if (p[0] == 'and') {return proalland(p,pl,al)}
  if (p[0] == 'or') {return proallor(p,pl,al)}
  if (p[0] == 'same') {return proallsame(p,pl,al)}
  if (p[0] == 'distinct') {return proalldistinct(p,pl,al)}
  if (p[0] == 'cell') {return proallcell(p,pl,al)}
  return proallrs(p,pl,al)}

// TLH: changed proall to proone
function proallnot (p,pl,al)
 {if (proone(p[1],empty(),al) == false) {proallexit(pl,al)}}

function proalland (p,pl,al)
 {proallexit(append(rest(p),pl),al)}

function proallor (p,pl,al)
 {for (var i=0; i<p.length; i++) {proall(p[i],pl,al)}}

function proallsame (p,pl,al)
 {al = unify(p[1],p[2],al);
  if (al != false) {proallexit(pl,al)}}

function proalldistinct (p,pl,al)
 {if (unify(p[1],p[2],al) == false) {proallexit(pl,al)}}

// TLH: Added
function proallcell(p,pl,al)
 {var bl = unify(cellvalue(p[1]), p[2], al);
  if (bl != false) {proallexit(pl,bl);}}

function proallrs (p,pl,al)
 {var copy;
  var bl;
  for (var i=0; i<rulebase.length; i++)
      {copy = standardize(rulebase[i]);
       if (copy[0] == 'rule')
          {bl = unify(copy[1],p,al);
           if (bl != false) {proall(copy[2],append(copy.slice(3),pl),bl)}}
       else {bl = unify(copy,p,al);
             if (bl != false) {proallexit(pl,bl)}}}}

// TLH: changed answer to answers
function proallexit (pl,bl)
 {if (pl.length != 0) {return proall(pl[0],rest(pl),bl)};
  answers.push(plug(thing,bl))}

//------------------------------------------------------------------------------

// TLH: Added entire procedure: only extensional tables, and query is ands and ors of literals
//     that obey the usual safety property: a negative literal and an attached literal is
//     always ground by evaluation time, ordered from left to right.  Find all answers/proofs.

// Irritation: each proof is a list, but proofs is an array.
//   Worried that cons is cheap but array.push is expensive.

function proallsupp (p,pl,al,pf)
 {//alert("proallsupp(" + p + ';' + pl + ';' + al + ";" + pf + ")");
  if (symbolp(p)) {return proallsupprs(p,pl,al,pf)}
  if (p[0] == 'not') {return proallsuppnot(p,pl,al,pf)}
  if (p[0] == 'and') {return proallsuppand(p,pl,al,pf)}
  if (p[0] == 'or') {return proallsuppor(p,pl,al,pf)}
  if (p[0] == 'cell') {return proallsuppcell(p,pl,al,pf)}
  return proallsupprs(p,pl,al,pf)}

function proallsuppnot (p,pl,al,pf)
 {//alert("proallsuppnot(" + p + ';' + pl + ';' + al + ';' + pf + ")");
  if (proonesupp(p[1],empty(),al,nil) == false) { proallsuppexit(p,pl,al,pf); }}

function proallsuppand (p,pl,al,pf)
 {proallsuppexit(nil,append(rest(p),pl),al,pf)}

function proallsuppor (p,pl,al,pf)
 {for (var i=1; i<p.length; i++) {proallsupp(p[i],pl,al,pf);}}

function proallsuppcell(p,pl,al,pf)
 {//alert("proallsuppcell(" + p + ';' + pl + ';' + al + ';' + pf + ")");
  var bl = unify(cellvalue(p[1]), p[2], al);
  if (bl != false) {proallsuppexit(p,pl,bl,pf);}} 

function proallsupprs (p,pl,al,pf)
 {//alert("proallsupprs(" + p + ';' + pl + ';' + al + ';' + pf + ")");
  var copy;
  var bl;
  for (var i=0; i<rulebase.length; i++)
      {copy = standardize(rulebase[i]);
       if (copy[0] == 'rule')
          {bl = unify(copy[1],p,al);
           if (bl != false) {proallsupp(copy[2],append(copy.slice(3),pl),bl,pf)}}
       else {bl = unify(copy,p,al);
             if (bl != false) {proallsuppexit(p,pl,bl,pf)}}}}

function proallsuppexit (p,pl,al,pf)
 {//alert("flatallproofexit(" + p + ';' + pl + ';' + al + ';' + pf + ")");
  if (pl.length != 0) {
     if (nullp(p)) { return proallsupp(pl[0],rest(pl),al,pf); }
     else { return proallsupp(pl[0],rest(pl),al,cons(cons(p,al),pf)); }}
  answers.push(plug(thing,al));
  if (nullp(p)) { supports.push(pf); }
  else { supports.push(cons(cons(p,al),pf)); }}

//------------------------------------------------------------------------------
// unifier
//------------------------------------------------------------------------------

function unifier (x,y)
 {return unify(x,y,nil)}

function unify (x,y,bl)
 {if (x == y) {return bl};
  if (varp(x)) {return unifyvar(x,y,bl)};
  if (symbolp(x)) {return unifyatom(x,y,bl)};
  return unifyexp(x,y,bl)}

function unifyvar (x,y,bl)
 {var dum = assoc(x,bl);
  if (dum != false) {return unify(cdr(dum),y,bl)};
  if (x == unifyval(y,bl)) {return bl};
  return acons(x,y,bl)}

function unifyval (y,bl)
 {if (varp(y))
     {var dum = assoc(y,bl);
      if (dum != false) {return unifyval(cdr(dum),bl)};
      return y};
  return y}

function unifyatom (x,y,bl)
 {if (varp(y)) {return unifyvar(y,x,bl)}
  else return false}

function unifyexp(x,y,bl)
 {if (varp(y)) {return unifyvar(y,x,bl)}
  if (symbolp(y)) {return false};
  var m = x.length;
  var n = y.length;  
  if (m != n) {return false};
  for (var i=0; i<m; i++)
      {bl = unify(x[i],y[i],bl);
       if (bl == false) {return false}};
  return bl}

//------------------------------------------------------------------------------

function plug (x,bl)
 {if (varp(x)) {return plugvar(x,bl)};
  if (symbolp(x)) {return x};
  return plugexp(x,bl)}

function plugvar (x,bl)
 {var dum = assoc(x,bl);
  if (dum == false) {return x};
  return plug(cdr(dum),bl)}

function plugexp (x,bl)
 {var exp = new Array(x.length);
  for (var i=0; i<x.length; i++)
      {exp[i] = plug(x[i],bl)};
  return exp}

//------------------------------------------------------------------------------

var alist;

function standardize (x)
 {alist = nil;
  return standardizeit(x)}

function standardizeit (x)
 {if (varp(x)) {return standardizevar(x)};
  if (symbolp(x)) {return x};
  return standardizeexp(x)}

function standardizevar (x)
 {var dum = assoc(x,alist);
  if (dum != false) {return cdr(dum)};
  var rep = newvar();
  alist = acons(x,rep,alist);
  return rep}

function standardizeexp (x)
 {var n = x.length;
  var exp = new Array(n);
  for (var i=0; i<n; i++)
      {exp[i] = standardizeit(x[i])};
  return exp}

//------------------------------------------------------------------------------
// Input and Output
//------------------------------------------------------------------------------

function readdata (str)
 {return parsedata(scan(str))}

function read (str)
 {return parse(scan(str))}

//------------------------------------------------------------------------------

var input = '';
var output = '';
var current = 0;

function scan (str)
 {input = str;
  output = new Array(0);
  var cur = 0;
  var len = input.length;
  while (cur < len)
   {var charcode = input.charCodeAt(cur);
    if (charcode == 32 || charcode == 13) {cur++}
    else if (charcode == 38) {output[output.length] = '&'; cur++}
    else if (charcode == 40) {output[output.length] = 'lparen'; cur++}
    else if (charcode == 41) {output[output.length] = 'rparen'; cur++}
    else if (charcode == 43) {output[output.length] = '+'; cur++}
    else if (charcode == 44) {output[output.length] = 'comma'; cur++}
    else if (charcode == 45) {output[output.length] = '-'; cur++}
    else if (charcode == 46) {output[output.length] = '.'; cur++}
    else if (charcode == 58) {cur = scanrulesym(cur)}
    else if (charcode == 60) {cur = scanbacksym(cur)}
    else if (charcode == 61) {cur = scanthussym(cur)}
    else if (charcode == 62) {output[output.length] = '>'; cur++}
    else if (charcode == 123) {output[output.length] = '{'; cur++}
    else if (charcode == 124) {output[output.length] = '|'; cur++}
    else if (charcode == 125) {output[output.length] = '}'; cur++}
    else if (charcode == 126) {output[output.length] = '~'; cur++}
    else if (idcharp(charcode)) {cur = scansymbol(cur)}
    else cur++};
  return output}

function scanrulesym (cur)
 {if (input.length > cur+1 && input.charCodeAt(cur+1) == 45)
     {output[output.length] = ':-'; return cur+2};
  if (input.length > cur+1 && input.charCodeAt(cur+1) == 61)
     {output[output.length] = ':='; return cur+2}
  else {output[output.length] = ':'; return cur+1}}

function scanbacksym (cur)
 {if (input.length > cur+1 && input.charCodeAt(cur+1) == 61)
     {if (input.length > cur+2 && input.charCodeAt(cur+2) == 62)
         {output[output.length] = '<=>'; return cur+3}
      else {output[output.length] = '<='; return cur+2}}
  else {output[output.length] = '<'; return cur+1}}

function scanthussym (cur)
 {if (input.length > cur+1 && input.charCodeAt(cur+1) == 62)
     {output[output.length] = '=>'; return cur+2}
  else {output[output.length] = '='; return cur+1}}

function scansymbol (cur)
 {var n = input.length;
  var exp = '';
  while (cur < n)
   {if (idcharp(input.charCodeAt(cur))) {exp = exp + input[cur]; cur++}
    else break};
  if (exp != '') {output[output.length] = exp};
  return cur}

// TLH: Changed 47 to 48 and 56 to 57 in idcharp.  Was dropping 9s in symbols.
function idcharp (charcode)
 {if (charcode >= 48 && charcode <= 57) {return true};
  if (charcode >= 65 && charcode <= 90) {return true};
  if (charcode >= 97 && charcode <= 122) {return true};
  if (charcode == 95) {return true};
  return false}

//------------------------------------------------------------------------------

function parsedata (str)
 {str.push('eof');
  input = str;
  current = 0;
  exp = new Array(0);
  while (current < input.length && input[current] != 'eof')
   {exp[exp.length] = parsexp('lparen','rparen')};
  return exp}

function parse (str)
 {str.push('eof');
  input = str;
  current = 0;
  return parsexp('lparen','rparen')}

function parsexp (lop,rop)
 {var left = parseprefix(rop);
  while (current < input.length)
   {if (input[current] == 'eof') {return left}
    else if (input[current] == 'lparen') {left = parseatom(left)}
    else if (input[current] == '.') {current++; return(left)}
    else if (precedencep(lop,input[current])) {return left}
    else {left = parseinfix(left,input[current],rop)}};
  return left}

function parseprefix (rop)
 {var left = input[current];
  current++;
  if (left == 'lparen') {left = parsexp('lparen','rparen'); current++; return left};
  if (left == '~') {return makenegation(parsexp('~',rop))};
  if (left == '{') {return parseclause()};
  return left}

function parseatom (left)
 {var exp = parseparenlist();
  exp.unshift(left);
  return exp}

function parseparenlist ()
 {var exp = new Array(0);
  current++;
  if (input[current] == 'rparen') {current++; return exp};
  while (current < input.length)
   {exp.push(parsexp('comma','rparen'));
    if (input[current] == 'rparen') {current++; return exp};
    if (input[current] == 'comma') {current++} else {return exp}};
  return exp}

function parseclause ()
 {var exp = seq('clause');
  while (current < input.length)
   {exp.push(parsexp('comma','rparen'));
    if (input[current] == '}') {current++; return exp};
    if (input[current] == 'comma') {current++}
    else {return exp}};
  return exp}

function parseinfix (left,op,rop)
 {if (op == ':') {return parsequantifier(left,rop)};
  if (op == '&') {return parseand(left,rop)};
  if (op == '|') {return parseor(left,rop)};
  if (op == '<=>') {return parseequivalence(left,rop)};
  if (op == '=>') {return parseimplication(left,rop)};
  if (op == '<=') {return parsereduction(left,rop)};
  if (op == ':-') {return parserule(left,rop)};
  if (op == ':=') {return parsedefinition(left,rop)};
  return left}

function parsequantifier (left,rop)
 {current++;
  if (left[0] == 'A') {return makeuniversal(left.slice(1,left.length),parsexp(':',rop))};
  if (left[0] == 'E') {return makeexistential(left.slice(1,left.length),parsexp(':',rop))};
  return makeuniversal(left,parsexp(':',rop))}

function parseand (left,rop)
 {current++;
  return makeconjunction(left,parsexp('&',rop))}

function parseor (left,rop)
 {current++;
  return makedisjunction(left,parsexp('|',rop))}

function parseequivalence (left,rop)
 {current++;
  var dum = parsexp('<=>',rop);
  return makeequivalence(left,dum)}

function parseimplication (left,rop)
 {current++;
  var dum = parsexp('=>',rop);
  return makeimplication(left,dum)}

function parsereduction (left,rop)
 {current++;
  var dum = parsexp('<=',rop);
  return makereduction(left,dum)}


function parserule (left,rop)
 {current++;
  var dum = parsexp(':-',rop);
  return makerule(left,dum)}

function parsedefinition (left,rop)
 {current++;
  var dum = parsexp(':=',rop);
  return makedefinition(left,dum)}

function precedencep (lop,rop)
 {var dum = pp(lop,rop);
  //alert(lop + '-' + rop + '-' + dum);
  return dum}

function pp (lop,rop)
 {if (lop == ':') {return  rop != ':'};
  if (lop == '~') {return  rop != ':'};
  if (lop == '&') {return rop != ':' && rop != '~'};
  if (lop == '|') {return rop != ':' && rop != '~' && rop != '&'};
  if (lop == '=>') {return rop != ':' && rop != '~' && rop != '&' && rop != '|'};
  if (lop == '<=') {return rop != ':' && rop != '~' && rop != '&' && rop != '|'};
  if (lop == '<=>') {return rop != ':' && rop != '~' && rop != '&' && rop != '|'};
  if (lop == ':-') {return rop != ':' && rop != '~' && rop != '&' && rop != '|'};
  if (lop == ':=') {return rop != ':' && rop != '~' && rop != '&' && rop != '|'};
  return rop != ':' && rop != '~' && rop != '&' && rop != '|'
                    && rop != '=>' && rop != '<=' && rop != '<=>'
                    && rop != ':-' && rop != ':='}

function parenp (lop,op,rop)
 {return precedencep(lop,op) || precedencep(rop,op)}

//------------------------------------------------------------------------------

function doxml ()
 {var win = window.open();
  //win.document.open('text/html');
  win.document.writeln('&lt;?xml version="1.0"?&gt;<br/>\n');
  win.document.writeln('&lt;?xml-stylesheet type="text/xsl" href="../stylesheets/proof.xsl"?&gt;<br/>\n');
  win.document.write(xmlproof());
  win.document.close()}

function xmlproof ()
 {var exp = '';
  exp += '&lt;proof&gt;<br/>\n';
  for (var i=1; i<proof.length; i++)
      {exp += '  &lt;step&gt;<br/>';
       exp += '    &lt;number&gt;' + i + '&lt;/number&gt;<br/>\n';
       exp += '    &lt;sentence&gt;' + grind(proof[i][1]) + '&lt;/sentence&gt;<br/>\n';
       exp += '    &lt;justification&gt;' + prettify(proof[i][2]) + '&lt;/justification&gt;<br/>\n';
       for (var j=3; j<proof[i].length; j++)
           {exp += '    &lt;antecedent&gt;' + proof[i][j] + '&lt;/antecedent&gt;<br/>\n'};
       exp += '  &lt;/step&gt;<br/>\n'};
  exp += '&lt;/proof&gt;<br/>\n';
  return exp}

function xmlify (str)
 {str = str.replace('&','&amp;');
  str = str.replace('<=>','&lt;=&gt;');
  return str}

//------------------------------------------------------------------------------

function smoothdata (data)
 {var exp = '';
  var n = data.length;
  for (var i=0; i<n; i++)
      {exp = exp + smooth(data[i]) + '<br/>'}
  return exp}

function smooth (p)
 {if (symbolp(p)) {return p};
  var exp = p[0] + '(';
  if (p.length > 1) {exp += smooth(p[1])};
  for (var i=2; i<p.length; i++)
      {exp += ',' + smooth(p[i])}
  exp += ')';
  return exp}

//------------------------------------------------------------------------------
/*
function grindproof (proof)
 {var exp = '';
  exp = exp + '<table cellpadding="4" cellspacing="0" border="1">';
  exp = exp + '<tr bgcolor="#bbbbbb">';
  exp = exp + '<td>&nbsp;</td>'; //exp = exp + '<td><input type="checkbox" name="Selection"/></td>';
  exp = exp + '<th>Step</th><th>Proof</th><th>Justification</th>';
  exp = exp + '</tr>';
  for (var i=0; i<proof.length; i=i+3)
      {exp = exp + '<tr id="0">';
       exp = exp + '<td bgcolor="#eeeeee"><input id="' + (i/3 + 1) + '" type="checkbox"/></td>';
       exp = exp + '<td align="center" bgcolor="#eeeeee">' + (i/3 + 1) + '</td>';
       exp = exp + '<td>' + grind(proof[i+1]) + '</td>';
       exp = exp + '<td bgcolor="#eeeeee">' + proof[i+2] + '</td>';
       exp = exp + '</tr>'};  
       exp = exp + '</table>';
  return exp}
*/

function grindproof(proof)  // a proof is a list of (cons lit bindinglist)
  {var exp = '';
   exp += 'proof(';
   exp += grind(plug(car(car(proof)), cdr(car(proof))));
   for (var e=cdr(proof); e!=nil; e=cdr(e)) {
      exp += ', ';
      exp += grind(plug(car(car(e)),cdr(car(e)))); }
   exp += ')';
   return exp;}


function grinddata (data)
 {var exp = '';
  var n = data.length;
  for (var i=0; i<n; i++)
      {exp = exp + grind(data[i]) + '<br/>'}
  return exp}

function grindem (data)
 {var exp = '';
  var n = data.length;
  for (var i=0; i<n; i++)
      {exp = exp + grind(data[i]) + '\r'}
  return exp}

function grind (p)
 {return grindit(p,'lparen','rparen')}

function grindit (p,lop,rop)
 {if (symbolp(p)) {return p};
  if (p[0] == 'definition') {return grinddefinition(p,lop,rop)};
  if (p[0] == 'not') {return grindnegation(p,rop)};
  if (p[0] == 'and') {return grindand(p,lop,rop)};
  if (p[0] == 'or') {return grindor(p,lop,rop)};
  if (p[0] == 'equivalence') {return grindequivalence(p,lop,rop)};
  if (p[0] == 'implication') {return grindimplication(p,lop,rop)};
  if (p[0] == 'reduction') {return grindreduction(p,lop,rop)};
  if (p[0] == 'rule') {return grindrule(p,lop,rop)};
  if (p[0] == 'clause') {return grindclause(p)};
  if (p[0] == 'forall') {return grinduniversal(p,lop,rop)};
  if (p[0] == 'exists') {return grindexistential(p,lop,rop)};
  return grindatom(p)}

function grindatom (p)
 {var n = p.length;
  var exp = p[0] + '(';
  if (n>1) {exp += grind(p[1])};
  for (var i=2; i<n; i++)
      {exp = exp + ',' + grind(p[i])}
  exp += ')';
  return exp}

function grinddefinition (p,lop,rop)
 {var exp = '';
  var parens = parenp(lop,':=',rop);
  if (parens) {lop = 'lparen'; rop = 'rparen'};
  if (parens) {exp = '('};
  exp = exp + grindit(p[1],lop,':=') + ' := ' + grindit(p[2],':=',rop);
  if (parens) {exp = exp + ')'};
  return exp}

function grindnegation (p,rop)
 {return '~' + grindit(p[1],'~',rop)}

function grindand (p,lop,rop)
 {if (p.length == 1) {return 'true'};
  if (p.length == 2) {return grind(p[1],lop,rop)};
  var exp;
  exp = grindleft(lop,'&',rop) + grindit(p[1],lop,'&');
  for (var i=2; i<p.length-1; i++)
      {exp = exp + ' & ' + grindit(p[i],'&','&')};
  exp = exp + ' & ' + grindit(p[p.length-1],'&',rop) + grindright(lop,'&',rop);
  return exp}

function grindor (p,lop,rop)
 {var exp;
  if (p.length == 1) {return 'false'};
  if (p.length == 2) {return grind(p[1],lop,rop)};
  exp = grindleft(lop,'|',rop) + grindit(p[1],lop,'|');
  for (var i=2; i<p.length-1; i++)
      {exp = exp + ' | ' + grindit(p[i],'|','|')};
  exp = exp + ' | ' + grindit(p[p.length-1],'|',rop) + grindright(lop,'|',rop);
  return exp}

function grindequivalence (p,lop,rop)
 {var exp = '';
  var parens = parenp(lop,'<=>',rop);
  if (parens) {lop = 'lparen'; rop = 'rparen'};
  if (parens) {exp = '('};
  exp = exp + grindit(p[1],lop,'<=>') + ' <=> ' + grindit(p[2],'<=>',rop);
  if (parens) {exp = exp + ')'};
  return exp}

function grindimplication (p,lop,rop)
 {var exp = '';
  var parens = parenp(lop,'=>',rop);
  if (parens) {lop = 'lparen'; rop = 'rparen'};
  if (parens) {exp = '('};
  exp = exp + grindit(p[1],lop,'=>') + ' => ' + grindit(p[2],'=>',rop);
  if (parens) {exp = exp + ')'};
  return exp}

function grindreduction (p,lop,rop)
 {var exp = '';
  var parens = parenp(lop,'<=',rop);
  if (parens) {lop = 'lparen'; rop = 'rparen'};
  if (parens) {exp = '('};
  exp = exp + grindit(p[1],lop,'<=') + ' <= ' + grindit(p[2],'<=',rop);
  if (parens) {exp = exp + ')'};
  return exp}

function grindrule (p,lop,rop)
 {var exp = grind(p[1]) + ' :- ';
  if (p.length == 2) {exp += 'true'}
  else if (p.length == 3) {exp += grindit(p[2],':-',rop)}
  else {exp += grindit(p[2],lop,'&');
        for (var i=3; i<p.length-1; i++)
            {exp = exp + ' & ' + grindit(p[i],'&','&')};
        exp += ' & ' + grindit(p[p.length-1],'&',rop)};
  return exp}

function grindclause (p)
 {var exp = '{';
  if (p.length > 1) {exp = exp + grind(p[1])};
  for (var i=2; i<p.length; i++)
      {exp = exp + ',' + grind(p[i])};
  exp = exp + '}';
  return exp}

function grinduniversal (p,lop,rop)
 {return grindleft(lop,':',rop) + 'A' + grindit(p[1],lop,':') + ':' + grindit(p[2],':',rop) + grindright(lop,':',rop)}

function grindexistential (p,lop,rop)
 {return grindleft(lop,':',rop) + 'E' + grindit(p[1],lop,':') + ':' + grindit(p[2],':',rop) + grindright(lop,':',rop)}

function grindleft (lop,op,rop)
 {if (precedencep(lop,op) || precedencep(rop,op)) {return "("}
  return ""}

function grindright (lop,op,rop)
 {if (precedencep(lop,op) || precedencep(rop,op)) {return ")"}
  return ""}

function grindalist (al)
 {var exp = '';
  if (al == false) {return 'false'};
  for (var l=al; !nullp(l); l=cdr(l))
      {exp = exp + car(car(l)) + ' = ' + grind(cdr(car(l))) + '<br/>'}
  return exp}

//------------------------------------------------------------------------------

function displayproof (proof)
 {var exp = '';
  exp = exp + '<table cellpadding="4" cellspacing="0" border="1">';
  exp = exp + '<tr bgcolor="#bbbbbb">';
  exp = exp + '<td><input type="checkbox" onClick="doselectall()"/></td>';
  exp = exp + '<th>Step</th><th>Proof</th><th>Justification</th>';
  exp = exp + '</tr>';
  for (var i=1; i<proof.length; i++)
      {exp = exp + '<tr id="0">';
       exp = exp + '<td bgcolor="#eeeeee"><input id="' + i + '" type="checkbox"/></td>';
       exp = exp + '<td align="center" bgcolor="#eeeeee">' + i + '</td>';
       exp = exp + '<td>' + grind(proof[i][1]) + '</td>';
       exp += '<td bgcolor="#eeeeee">';
       exp += prettify(proof[i][2]);
       if (proof[i].length > 3)
          {exp += ': ' + proof[i][3];
           for (var j=4; j<proof[i].length; j++) {exp += ', ' + proof[i][j]}};
       exp += '</td>';
       exp = exp + '</tr>'};  
       exp = exp + '</table>';
  return exp}

function prettify (str)
 {return str.replace('_',' ')}

//------------------------------------------------------------------------------
// Basic Data Structure Subroutines
//------------------------------------------------------------------------------

function makeatom (r,x,y)
 {var exp = new Array(3);
  exp[0] = r;
  exp[1] = x;
  exp[2] = y;
  return exp}

function makeconditional (p,x,y)
 {var exp = new Array(4);
  exp[0] = 'if';
  exp[1] = p;
  exp[2] = x;
  exp[3] = y;
  return exp}

function makenegation (p)
 {var exp = new Array(2);
  exp[0] = 'not';
  exp[1] = p;
  return exp}

function makeconjunction (p,q)
 {var exp = new Array(2);
  exp[0] = 'and';
  exp[1] = p;
  exp[2] = q;
  return exp}

function makedisjunction (p,q)
 {var exp = new Array(2);
  exp[0] = 'or';
  exp[1] = p;
  exp[2] = q;
  return exp}

function maksand (s)
 {if (s.length == 0) {return true};
  if (s.length == 1) {return s[0]};
  return seq('and').concat(s)}

function maksor (s)
 {if (s.length == 0) {return false};
  if (s.length == 1) {return s[0]};
  return seq('or').concat(s)}

function makeclause (p,q)
 {var exp = new Array(2);
  exp[0] = 'clause';
  exp[1] = p;
  exp[2] = q;
  return exp}

function makeequivalence (head,body)
 {var exp = new Array(3);
  exp[0] = 'equivalence';
  exp[1] = head;
  exp[2] = body;
  return exp}

function makereduction (head,body)
 {var exp = new Array(3);
  exp[0] = 'reduction';
  exp[1] = head;
  exp[2] = body;
  return exp}

function makeimplication (head,body)
 {var exp = new Array(3);
  exp[0] = 'implication';
  exp[1] = head;
  exp[2] = body;
  return exp}

function makerule (head,body)
 {var exp = new Array(3);
  exp[0] = 'rule';
  exp[1] = head;
  exp[2] = body;
  return exp}

function makedefinition (head,body)
 {if (!symbolp(body) & body[0]=='and')
     {var exp = new Array(body.length+1);
      exp[0]='definition';
      exp[1]=head;
      for (var i=1; i<body.length; i++) {exp[i+1]=body[i]};
      return exp}
  else {var exp = new Array(3);
        exp[0] = 'definition';
	exp[1] = head;
	exp[2] = body;
	return exp}}

function makeuniversal (variable,scope)
 {var exp = new Array(3);
  exp[0] = 'forall';
  exp[1] = variable;
  exp[2] = scope;
  return exp}

function makeexistential (variable,scope)
 {var exp = new Array(3);
  exp[0] = 'exists';
  exp[1] = variable;
  exp[2] = scope;
  return exp}

function makeclause ()
 {var exp = new Array(0);
  exp[0] = 'clause';
  return exp}

function makeclause1 (p)
 {var exp = new Array(0);
  exp[0] = 'clause';
  exp[1] = p;
  return exp}

function makeclause2 (p,q)
 {var exp = new Array(0);
  exp[0] = 'clause';
  exp[1] = p;
  exp[2] = q;
  return exp}

function makestep (sentence,justification,p1,p2)
 {var exp = new Array(3);
  exp[0] = 'step';
  exp[1] = sentence;
  exp[2] = justification;
  if (p1) {exp[3] = p1};
  if (p2) {exp[4] = p2};
  return exp}

function makeproof ()
 {var exp = new Array(1);
  exp[0] = 'proof';
  return exp}

//------------------------------------------------------------------------------

var counter = 0;

function newvar ()
 {counter++;
  return 'V' + counter}

function newsym ()
 {counter++;
  return 'c' + counter}

function varp (x)
 {return typeof x == 'string' && x !== "" && x[0] === '?'}  // x[0].toUpperCase()}

function symbolp (x)
 {return typeof x == 'string'}

/*
 function numberp(x) 
 {return typeof(x) == 'number'}

function equalp (p,q)
 {if (symbolp(p)) {if (symbolp(q)) {return p==q} else {return false}};
  if (symbolp(q)) {return false};
  if (numberp(p)) {if (numberp(q)) {return p==q} else {return false}};
  if (numberp(q)) {return false};
  if (p.length != q.length) {return false};
  for (var i=0; i<p.length; i++) {if (!equalp(p[i],q[i])) {return false}};
  return true}
*/

//------------------------------------------------------------------------------

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

//------------------------------------------------------------------------------

var nil = 'nil';

function cons (x,l)
 {var cell = new Array(2);
  cell[0] = x;
  cell[1] = l;
  return cell}

function car (l)
 {return l[0]}

function cdr (l)
 {return l[1]}

function nullp (l)
 {return l == 'nil'}

function len (l)
 {var n = 0;
  for (var m=l; m!=nil; m = cdr(m)) {n = n+1};
  return n}

function memberp (x,l)
 {if (nullp(l)) {return false};
  if (car(l) == x) {return true};
  if (memberp(x,cdr(l))) {return true};
  return false}

function acons (x,y,al)
 {return cons(cons(x,y),al)}

function assoc (x,al)
 {if (nullp(al)) {return false};
  if (x == car(car(al))) {return car(al)};
  return assoc(x,cdr(al))}

function nreverse (l)
 {if (nullp(l)) {return nil}
  else {return nreversexp(l,nil)}}

function nreversexp (l,ptr)
 {if (cdr(l) == nil) {l[1] = ptr; return l}
  else {var rev = nreversexp(cdr(l),l);
        l[1] = ptr;
        return rev}}

//------------------------------------------------------------------------------
// End
//------------------------------------------------------------------------------
