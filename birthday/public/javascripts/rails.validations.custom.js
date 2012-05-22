clientSideValidations.validators.local['month'] = function(element, options) {
	var res;
	if( ( res = neg_month_b( x_func, cellvalue( "month" ) ) instanceof expr ) ) {
		return options.message;
	}
}

clientSideValidations.validators.local['day'] = function(element, options) {
	var res;
	if( ( res = neg_day_b( x_func, cellvalue( "day" ) ) instanceof expr ) ) {
		return options.message;
	}
}