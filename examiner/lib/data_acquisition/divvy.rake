task :mkdirs do
  require 'fileutils'
  FileUtils.mkdir_p("#{Rails.root}/log/rsbc")
end

task :rsbc => [:mkdirs, :environment] do 
  include RsbcHelper

  # Get models
  Dir.glob("#{Rails.root}" + '/app/models/*.rb').each { |file| require file }
  @models = ActiveRecord::Base.send :subclasses
  puts @models

  @models.each do |model| 
    classify_type(model)
    mimic_server_side_validation(model) 
  end 
end

# Returns only the custom validators to be run in mimic_server_side_validation
def classify_type(model)
  include RsbcHelper

  app_name = Rails.application.class.parent_name

  types = File.new( "#{Rails.root}/log/rsbc/" + "validator_types", 'a' )
  type = ""
  
  validators = get_validations(model)
  validators.each do |validator|
    method = validator.to_s.split(" ")[1]
    if validator.class != Proc
      types.print app_name.to_s + "~" + model.to_s + "~" + validator.name.to_s + " " + method
      if validator.owner == model and validator.name.to_s.include? "validate_associated_records_for"
        type = "association"
      elsif validator.owner == model 
        type = "model_defined"
      elsif method.to_s.include? "ActiveModel::Validations" or method.to_s.include? "ActiveRecord::Validations"
        type = "builtin"
      elsif validator.owner < ActiveModel::Validator and !validator.instance_values["block"] 
        type = "validator"
      else 
        type = "unknown"
      end
    elsif validator.methods.include? :source_location
      types.print app_name.to_s + "~" + model.to_s + "~" + validator.source_location[1].to_s
      type = "gem"
    else
      types.print app_name.to_s + "~" + model.to_s + "~" + "ruby1.8.7-source_not_known"
      type = "gem"
    end
    types.puts " " + type + " "
  end
end
