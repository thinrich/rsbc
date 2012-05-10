var PHP = new PHP_JS();
var TLH = new TLH_builtins();

var univ;
var useshortnames = false;

var component_day = new set("day", "month");
var dependent = new Object();
dependent["day"] = component_day;
dependent["month"] = component_day;

var prettynames = new Object();
prettynames[undefined] = '';
prettynames[''] = '';
prettynames['1'] = '1';
prettynames['false'] = 'false';
prettynames['true'] = 'true';
prettynames[30] = 30;
prettynames[1] = 1;
prettynames[2] = 2;

var uglynames = new Object();
uglynames[''] = '';
uglynames['1'] = '1';
uglynames['false'] = 'false';
uglynames['true'] = 'true';
uglynames[30] = 30;
uglynames[1] = 1;
uglynames[2] = 2;

function init () { 
   completep = true;
   casesensitive = true;
   allowconflicts = true;
   debug = false;
   valuecount = 7;
   init_index();
   univ = ds.get(datastore, "univ");
   var mycellarray = new Array();
   mycellarray[0] = new cell('month', "string", "textbox", negs_month, undefined, negsupps_month, undefined, negsuppx_month, undefined, component_day, false, new set(''), true);
   mycellarray[1] = new cell('day', "string", "textbox", negs_day, undefined, negsupps_day, undefined, negsuppx_day, undefined, component_day, false, new set(''), true);
   initspread(mycellarray); }

function external_init () {  }

function submitprep () { 
   var s = new set();
   if (!(findcell("month").conflictset.empty())) {
      s.adjoin("month");}
   if (!(findcell("day").conflictset.empty())) {
      s.adjoin("day");}
   if (!(s.empty())) {
      alert('Errors remain.  You must fix them before submitting.');
      return false;}
   clear_forced_gui();
   return true; }

var datastore;

function init_index () { 
   datastore = new dictionary();
   ds.set(datastore, "univ", new hashbag(new expr(''), new expr('1'), new expr('false'), new expr('true'), new expr(30), new expr(1), new expr(2)));
   ds.set(datastore, "boolean", new set(new expr('false'), new expr('true'))); }

var x_func = function (newval, support, sofar) { 

return new pair(true, newval); };

var s_func = function (newval, support, sofar) { 

return new pair(false, ds.adjoin(sofar, newval, equalp)); };

var suppx_func = function (newval, support, sofar) { 

return new pair(true, new pair(newval, support)); };

var supps_func = function (newval, support, sofar) { 

return new pair(false, ds.adjoin(sofar, new pair(newval, support), equalp)); };

function check_univ (x0) { return ds.member(ds.get(datastore, "univ"), new expr(x0), equalp); }

function check_boolean (x0) { return ds.member(ds.get(datastore, "boolean"), new expr(x0), equalp); }

function enum_univ (x0) { 
   
   return ds.get(datastore, "univ"); }

function enum_boolean (x0) { 
   
   return ds.get(datastore, "boolean"); }

function negx_day (x0) { 
   var v = neg_day(x_func, x0);
   if ((v instanceof expr)) return v;
   else return false; }

function negs_day (x0) { return neg_day(s_func, x0); }

function negsuppx_day (x0) { return neg_day(suppx_func, x0); }

function negsupps_day (x0) { return neg_day(supps_func, x0); }

function neg_day (onsuccess, x0) { 
   if (varp(x0)) {
      if (!((neg_day_f === undefined))) return neg_day_f(onsuccess, x0);
      else return undefined;}
   else {
      if (!((neg_day_b === undefined))) return neg_day_b(onsuccess, x0);
      else return undefined;} }

function neg_day_b (onsuccess, nsh29) { 
   var sofar = new set();
   var tmp;
   var x0 = nsh29;
   if (hascellvalue("month")) {
      var month = "month";
      month = 2;
      if ((cellvalue("month") === month)) {
         if (!((x0 < 30))) {
            if ((month === 2)) {
               tmp = onsuccess(new expr(x0), new set("month"), sofar);
               if ((ds.first(tmp) === true)) return ds.second(tmp);
               else sofar = ds.second(tmp);}}}
      x0 = nsh29;
      var month = "month";
      month = 2;
      if ((cellvalue("month") === month)) {
         if (!((x0 >= 1))) {
            if ((month === 2)) {
               tmp = onsuccess(new expr(x0), new set("month"), sofar);
               if ((ds.first(tmp) === true)) return ds.second(tmp);
               else sofar = ds.second(tmp);}}}
      x0 = nsh29;}
   if (!((x0 === x0))) {
      tmp = onsuccess(new expr(x0), new set(), sofar);
      if ((ds.first(tmp) === true)) return ds.second(tmp);
      else sofar = ds.second(tmp);
      x0 = nsh29;}
   return sofar; }

function neg_day_f (onsuccess, nsh30) { 
   var sofar = new set();
   var tmp;
   var x0 = nsh30;
   if (hascellvalue("month")) {
      var month = "month";
      month = 2;
      if ((cellvalue("month") === month)) {
         if ((month === 2)) {
            var arh30 = enum_univ(x0);
            for (var key in ds.data(arh30)) {
               x0 = ds.element(ds.element(arh30, key), 0);
               if (!((x0 < 30))) {
                  tmp = onsuccess(new expr(x0), new set("month"), sofar);
                  if ((ds.first(tmp) === true)) return ds.second(tmp);
                  else sofar = ds.second(tmp);}}}}
      x0 = nsh30;
      var month = "month";
      month = 2;
      if ((cellvalue("month") === month)) {
         if ((month === 2)) {
            var arh31 = enum_univ(x0);
            for (var key in ds.data(arh31)) {
               x0 = ds.element(ds.element(arh31, key), 0);
               if (!((x0 >= 1))) {
                  tmp = onsuccess(new expr(x0), new set("month"), sofar);
                  if ((ds.first(tmp) === true)) return ds.second(tmp);
                  else sofar = ds.second(tmp);}}}}
      x0 = nsh30;}
   var arh32 = enum_univ(x0);
   for (var key in ds.data(arh32)) {
      x0 = ds.element(ds.element(arh32, key), 0);
      if (!((x0 === x0))) {
         tmp = onsuccess(new expr(x0), new set(), sofar);
         if ((ds.first(tmp) === true)) return ds.second(tmp);
         else sofar = ds.second(tmp);}}
   x0 = nsh30;
   return sofar; }

function negx_month (x0) { 
   var v = neg_month(x_func, x0);
   if ((v instanceof expr)) return v;
   else return false; }

function negs_month (x0) { return neg_month(s_func, x0); }

function negsuppx_month (x0) { return neg_month(suppx_func, x0); }

function negsupps_month (x0) { return neg_month(supps_func, x0); }

function neg_month (onsuccess, x0) { 
   if (varp(x0)) {
      if (!((neg_month_f === undefined))) return neg_month_f(onsuccess, x0);
      else return undefined;}
   else {
      if (!((neg_month_b === undefined))) return neg_month_b(onsuccess, x0);
      else return undefined;} }

function neg_month_b (onsuccess, nsh32) { 
   var sofar = new set();
   var tmp;
   var x0 = nsh32;
   if (hascellvalue("day")) {
      if ((x0 === 2)) {
         var day = "day";
         day = cellvalue("day");
         if (!((day < 30))) {
            tmp = onsuccess(new expr(x0), new set("day"), sofar);
            if ((ds.first(tmp) === true)) return ds.second(tmp);
            else sofar = ds.second(tmp);}
         x0 = nsh32;}
      if ((x0 === 2)) {
         var day = "day";
         day = cellvalue("day");
         if (!((day >= 1))) {
            tmp = onsuccess(new expr(x0), new set("day"), sofar);
            if ((ds.first(tmp) === true)) return ds.second(tmp);
            else sofar = ds.second(tmp);}
         x0 = nsh32;}}
   if (!((x0 === x0))) {
      tmp = onsuccess(new expr(x0), new set(), sofar);
      if ((ds.first(tmp) === true)) return ds.second(tmp);
      else sofar = ds.second(tmp);
      x0 = nsh32;}
   return sofar; }

function neg_month_f (onsuccess, nsh33) { 
   var sofar = new set();
   var tmp;
   var x0 = nsh33;
   if (hascellvalue("day")) {
      x0 = 2;
      var day = "day";
      day = cellvalue("day");
      if (!((day < 30))) {
         if ((x0 === 2)) {
            tmp = onsuccess(new expr(x0), new set("day"), sofar);
            if ((ds.first(tmp) === true)) return ds.second(tmp);
            else sofar = ds.second(tmp);}}
      x0 = nsh33;
      x0 = 2;
      var day = "day";
      day = cellvalue("day");
      if (!((day >= 1))) {
         if ((x0 === 2)) {
            tmp = onsuccess(new expr(x0), new set("day"), sofar);
            if ((ds.first(tmp) === true)) return ds.second(tmp);
            else sofar = ds.second(tmp);}}
      x0 = nsh33;}
   var arh33 = enum_univ(x0);
   for (var key in ds.data(arh33)) {
      x0 = ds.element(ds.element(arh33, key), 0);
      if (!((x0 === x0))) {
         tmp = onsuccess(new expr(x0), new set(), sofar);
         if ((ds.first(tmp) === true)) return ds.second(tmp);
         else sofar = ds.second(tmp);}}
   x0 = nsh33;
   return sofar; }

