class Birthdate < ActiveRecord::Base
  validates :day, presence: true
  validates :month, presence: true, feb: true
  validates :year, presence: true
end
