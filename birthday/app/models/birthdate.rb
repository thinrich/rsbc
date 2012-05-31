class Birthdate < ActiveRecord::Base
  validates :day, :month, :year, numericality: true
  validates :day, :month, presence: true
  validates :day, :month, feb: true

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

