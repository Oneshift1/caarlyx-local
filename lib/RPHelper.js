var _ = require('underscore');

exports.getFields = function(fields, allowedFields){
	var query = {};
	
	_.each(fields, function(value, key, list){
		if (_.contains(allowedFields, key)){
			query[key] = value;
		}
	});
	
	return query;
}