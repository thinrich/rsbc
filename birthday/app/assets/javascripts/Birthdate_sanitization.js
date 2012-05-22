function sanitize(field) {
  var val = $("input[name=\"birthdate[" + field + "]\"]").val();
  switch(field) {
    case 'month': return parseInt(val);
    case 'day': return parseInt(val);
    default: return val;
  }
}
