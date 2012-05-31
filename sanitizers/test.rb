
# 1.9.3-p194 :003 > x = C.new(:day => 2, :month => 3)
#  => #<C:0x00000103ec2558 @day=2, @month=3> 
# 1.9.3-p194 :007 > x = C.new(:day => 99, :month => 2)
#  => #<C:0x00000103f9e8a0 @day=1, @month=2> 

class C
  include ActiveModel::Model
  attr_accessor :day, :month
  def sanitize_me(record)
    if record.month == 2 then
      unless record.day >= 1 and record.day < 30
        #record.errors[:day] << "days in february must be between 1 and 29"
        record.day = 1
      end
    end
    return true
  end
end
