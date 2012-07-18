# Nested array structure for keeping track of validations within models within apps

class AppDatabase

  def initialize
    @apps = Array.new
  end

  class App #================================== NESTED CLASS App
    attr_accessor :name, :models

    def initialize(app, model, validation)
      @name = app
      @models = Array.new
      model = Model.new(model, validation)
      @models << model 
    end

    def add_model(model, validation)
      if @models.include? model
        index = @models.index(model)
        @models[index].add_validation(validation)
      else
        model = Model.new(model, validation)
        @models << model
      end
    end

    def ==(other)
      (@name == other) ? true : false
    end
  end

  class Model #================================ NEW NESTED CLASS Model
    attr_accessor :name, :validations

    def initialize(name, validation)
      @name = name
      @validations = Array.new
      @validations << validation
    end

    def add_validation(val_name)
      if @validations.include? val_name
        puts "ID ERROR! ID's must be unique. " + @name + val_name + " already exists"
      else
        @validations << val_name
      end
    end

    def ==(other)
      (@name == other) ? true : false
    end

  end

  #============================================ END OF NESTED CLASSES

  def get_models(app_name)
    index = @apps.index(app_name)
    models = @apps[index].models
  end   
  
  def get_validations(app_name, model_name)
    models = get_models(app_name)
    if models.include? model_name then 
      index = models.index(model_name)
      validations = models[index].validations
    else 
      puts "Model not found"
    end
    return validations
  end

  def add(id)
    app_name = id.split("~")[0]
    model_name = id.split("~")[1]
    validation_name = id.split("~")[2]
    if @apps.include? app_name then 
      app_index = @apps.index(app_name)
      @apps[app_index].add_model(model_name, validation_name)
    else
      app = App.new(app_name, model_name, validation_name)
      @apps << app
    end
  end

  def list_apps
    for i in 0..@apps.size-1
      puts @apps[i].name
    end
  end
  
  def list_models(app_name)
    if !@apps.include?(app_name) then puts "not found"; return false end
    puts "=== Listing models in " + app_name
    models = get_models(app_name)
    for i in 0..models.size-1
      puts models[i].name
    end
  end

  def list_validations(app_name, model_name) 
    if !@apps[@apps.index(app_name)].models.include? model_name then puts "not found"; return false end
    puts "=== Listing validations in " + model_name + " from " + app_name
    validations = get_validations(app_name, model_name)
    for i in 0..validations.size-1
      puts validations[i]
    end
  end
end

