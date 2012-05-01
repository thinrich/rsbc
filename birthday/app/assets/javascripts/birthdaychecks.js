var PHP = new PHP_JS();
var TLH = new TLH_builtins();



var univ;
var useshortnames = false;



var component_day = new set("day", "month");



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



function check_univ (x0) { return ds.member(ds.get(datastore, "univ"), new expr(x0), equalp); }



function check_boolean (x0) { return ds.member(ds.get(datastore, "boolean"), new expr(x0), equalp); }



function enum_univ (x0) { 
   
   return ds.get(datastore, "univ"); }



function enum_boolean (x0) { 
   
   return ds.get(datastore, "boolean"); }



function negx_day (x0) { 
   var v = neg_day(function (newval, support, sofar) { 

return new pair(true, newval); }, x0);
   if ((v instanceof expr)) return v;
   else return false; }



function negs_day (x0) { return neg_day(function (newval, support, sofar) { 

return new pair(false, ds.adjoin(sofar, newval, equalp)); }, x0); }



function negsuppx_day (x0) { return neg_day(function (newval, support, sofar) { 

return new pair(true, new pair(newval, support)); }, x0); }



function negsupps_day (x0) { return neg_day(function (newval, support, sofar) { 

return new pair(false, ds.adjoin(sofar, new pair(newval, support), equalp)); }, x0); }



function neg_day (onsuccess, x0) { 
   if (varp(x0)) {
      if (!((neg_day_f === undefined))) return neg_day_f(onsuccess, x0);
      else return undefined;}
   else {
      if (!((neg_day_b === undefined))) return neg_day_b(onsuccess, x0);
      else return undefined;} }



function neg_day_b (onsuccess, nsh166) { 
   var sofar = new set();
   var tmp;
   var x0 = nsh166;
   if (hascellvalue("month")) {
      var month = "month";
      month = 2;
      if ((cellvalue("month") === month)) {
         if (!((x0 < 30))) {
            if ((month === 2)) {
               tmp = onsuccess(new expr(x0), new set("month"), sofar);
               if ((ds.first(tmp) === true)) return ds.second(tmp);
               else sofar = ds.second(tmp);}}}
      x0 = nsh166;
      var month = "month";
      month = 2;
      if ((cellvalue("month") === month)) {
         if (!((x0 >= 1))) {
            if ((month === 2)) {
               tmp = onsuccess(new expr(x0), new set("month"), sofar);
               if ((ds.first(tmp) === true)) return ds.second(tmp);
               else sofar = ds.second(tmp);}}}
      x0 = nsh166;}
   if (!((x0 === x0))) {
      tmp = onsuccess(new expr(x0), new set(), sofar);
      if ((ds.first(tmp) === true)) return ds.second(tmp);
      else sofar = ds.second(tmp);
      x0 = nsh166;}
   return sofar; }



function neg_day_f (onsuccess, nsh167) { 
   var sofar = new set();
   var tmp;
   var x0 = nsh167;
   if (hascellvalue("month")) {
      var month = "month";
      month = 2;
      if ((cellvalue("month") === month)) {
         if ((month === 2)) {
            var arh167 = enum_univ(x0);
            for (var key in ds.data(arh167)) {
               x0 = ds.element(ds.element(arh167, key), 0);
               if (!((x0 < 30))) {
                  tmp = onsuccess(new expr(x0), new set("month"), sofar);
                  if ((ds.first(tmp) === true)) return ds.second(tmp);
                  else sofar = ds.second(tmp);}}}}
      x0 = nsh167;
      var month = "month";
      month = 2;
      if ((cellvalue("month") === month)) {
         if ((month === 2)) {
            var arh168 = enum_univ(x0);
            for (var key in ds.data(arh168)) {
               x0 = ds.element(ds.element(arh168, key), 0);
               if (!((x0 >= 1))) {
                  tmp = onsuccess(new expr(x0), new set("month"), sofar);
                  if ((ds.first(tmp) === true)) return ds.second(tmp);
                  else sofar = ds.second(tmp);}}}}
      x0 = nsh167;}
   var arh169 = enum_univ(x0);
   for (var key in ds.data(arh169)) {
      x0 = ds.element(ds.element(arh169, key), 0);
      if (!((x0 === x0))) {
         tmp = onsuccess(new expr(x0), new set(), sofar);
         if ((ds.first(tmp) === true)) return ds.second(tmp);
         else sofar = ds.second(tmp);}}
   x0 = nsh167;
   return sofar; }



function negx_month (x0) { 
   var v = neg_month(function (newval, support, sofar) { 

return new pair(true, newval); }, x0);
   if ((v instanceof expr)) return v;
   else return false; }



function negs_month (x0) { return neg_month(function (newval, support, sofar) { 

return new pair(false, ds.adjoin(sofar, newval, equalp)); }, x0); }



function negsuppx_month (x0) { return neg_month(function (newval, support, sofar) { 

return new pair(true, new pair(newval, support)); }, x0); }



function negsupps_month (x0) { return neg_month(function (newval, support, sofar) { 

return new pair(false, ds.adjoin(sofar, new pair(newval, support), equalp)); }, x0); }



function neg_month (onsuccess, x0) { 
   if (varp(x0)) {
      if (!((neg_month_f === undefined))) return neg_month_f(onsuccess, x0);
      else return undefined;}
   else {
      if (!((neg_month_b === undefined))) return neg_month_b(onsuccess, x0);
      else return undefined;} }



function neg_month_b (onsuccess, nsh169) { 
   var sofar = new set();
   var tmp;
   var x0 = nsh169;
   if (hascellvalue("day")) {
      if ((x0 === 2)) {
         var day = "day";
         day = cellvalue("day");
         if (!((day < 30))) {
            tmp = onsuccess(new expr(x0), new set("day"), sofar);
            if ((ds.first(tmp) === true)) return ds.second(tmp);
            else sofar = ds.second(tmp);}
         x0 = nsh169;}
      if ((x0 === 2)) {
         var day = "day";
         day = cellvalue("day");
         if (!((day >= 1))) {
            tmp = onsuccess(new expr(x0), new set("day"), sofar);
            if ((ds.first(tmp) === true)) return ds.second(tmp);
            else sofar = ds.second(tmp);}
         x0 = nsh169;}}
   if (!((x0 === x0))) {
      tmp = onsuccess(new expr(x0), new set(), sofar);
      if ((ds.first(tmp) === true)) return ds.second(tmp);
      else sofar = ds.second(tmp);
      x0 = nsh169;}
   return sofar; }



function neg_month_f (onsuccess, nsh170) { 
   var sofar = new set();
   var tmp;
   var x0 = nsh170;
   if (hascellvalue("day")) {
      x0 = 2;
      var day = "day";
      day = cellvalue("day");
      if (!((day < 30))) {
         if ((x0 === 2)) {
            tmp = onsuccess(new expr(x0), new set("day"), sofar);
            if ((ds.first(tmp) === true)) return ds.second(tmp);
            else sofar = ds.second(tmp);}}
      x0 = nsh170;
      x0 = 2;
      var day = "day";
      day = cellvalue("day");
      if (!((day >= 1))) {
         if ((x0 === 2)) {
            tmp = onsuccess(new expr(x0), new set("day"), sofar);
            if ((ds.first(tmp) === true)) return ds.second(tmp);
            else sofar = ds.second(tmp);}}
      x0 = nsh170;}
   var arh170 = enum_univ(x0);
   for (var key in ds.data(arh170)) {
      x0 = ds.element(ds.element(arh170, key), 0);
      if (!((x0 === x0))) {
         tmp = onsuccess(new expr(x0), new set(), sofar);
         if ((ds.first(tmp) === true)) return ds.second(tmp);
         else sofar = ds.second(tmp);}}
   x0 = nsh170;
   return sofar; }



