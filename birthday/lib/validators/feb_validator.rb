class FebValidator < ActiveModel::Validator
  def validate( record )
    if record.month == 2 then
        unless record.day >= 1 and record.day < 30 #and !record.day and f(record.day) > 3 then
	  record.errors[:day] << "days in february must be between 1 and 29"
        end
    end
  end
  def f (x)
    x > 2
  end
end
