class Birthdate < ActiveRecord::Base
  validates :day, :month, :year, numericality: true
  validates :day, :month, presence: true
  validates :day, :month, feb: true
end
