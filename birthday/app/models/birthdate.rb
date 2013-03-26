
class Birthdate < ActiveRecord::Base

   validates :year, :month, :day, presence: true, numericality: true

#   validates :month, :day, feb: true

   validate :validate_feb

#   validate :year, :month, :day

   def validate_feb
     errors.add( "day", "day is greater than 29!!!" ) if day > 29 and month == 2
   end

end

