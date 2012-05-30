class FebValidator < ActiveModel::Validator

  def validate( record )
    if record.month == 2 then
        unless record.day >= 1 and record.day < 30
               record.errors[:day] << "days in february must be between 1 and 29"
 	       	   # record.errors.add( attr_name, :day, options.merge( value: value ) )
        end
    end
  end 
end

# class FebValidator < ActiveModel::Validator
#   def validate( record )
#     puts "validating #{record.inspect}"
#     record.errors[:day] = "error in day"
#   end
# end

# module ActiveModel::Validations::HelperMethods
#   def validates_february( *attr_names )
#     validates_with FebValidator, _merge_attributes( attr_names )
#   end
# end

