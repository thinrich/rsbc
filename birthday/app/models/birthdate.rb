#With the various ways of adding validators on a model we can do something like this:

# Model Schema
# year  integer
# month integer
# day   integer

class Birthdate < ActiveRecord::Base
  include Rsbc::Client
  validates :year, :month, :day, presence: true, numericality: true

  validates :month, :day, feb: true

  validate :my_custom_validator

  #jvalidate :year, :month, :day

  def my_custom_validator
    errors.add( "day", "day is greater than 29!!!" ) if day > 29 and month == 2
    #my rails dependent validation
    client_validation :feb_validator do
      req :day, :month

      #default error message will be stored in locale files but can be overwritten here
      fail "day is greater than 29!!!"

      client_validate do
        if month == 2
          day > 29 or day <= 0
        end
      end
    end

  end
  # def sanitize_me (record)
  #   if record.month == 2 then
  #     unless record.day >= 1 and record.day < 30
  #       #record.errors[:day] << "days in february must be between 1 and 29"
  #       record.day = 1
  #     end
  #   end
  #   return true
  # end
end

