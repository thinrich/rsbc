class FebValidator < ActiveModel::EachValidator
  def validate_each( record, attr_name, value )
    if record.month == 2
      unless record.day >= 1 and record.day < 30 #and !record.day and f(record.day) > 3 then
        record.errors.add( attr_name, :day, options.merge( value: value ) )
      end
    end
  end
end

module ActiveModel::Validations::HelperMethods
  def validates_feb( *attr_names )
    validates_with FebValidator, _merge_attributes( attr_names )
  end
end
