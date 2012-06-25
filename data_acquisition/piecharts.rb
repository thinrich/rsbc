# sript to parse log files in rails/log/rsbc/rsbc.log and turn it into useable stats

LIMIT = 10  # Modify this to set how many values are listed in under sexp, function and keyword lists
Outdir = "/home/mike/Research/data/data.csv" # For the .cvs file

#   FIELDS ::    [ Model_Name, Owner_name, Validation_Name, Status, SEXP, values, KEYWORD, values, FUNCTION, values, METHOD, values, DATABASE, values, UNKNOWN] 
#                |----------ID----------------------------|         |--------------------------------ERRORS---------------------------------------------------|
class Validation

  attr_accessor :status, :kifstring

  def initialize(id)
    @id = id 
    @errors = {:SEXP => [], :KEYWORD => [], :FUNCTION => [], :METHOD => [], :DATABASE => [], :UNKNOWN => []}
  end

  def get_sexp
    @errors[:SEXP]
  end

  def get_keyword
    @errors[:KEYWORD]
  end

  def get_function
    @errors[:FUNCTION]
  end

  def get_method
    @errors[:METHOD]
  end

  def get_database
    @errors[:DATABASE]
  end

  def get_unknown
    @errors[:UNKNOWN]
  end

  def add_error(type, value)
    if type == :FAILURE then
      @kifstring = value
    else
      @errors[type] << value
    end
  end
  
  def print_errors
    print "SEXP, " + @errors[:SEXP].to_s.delete(",") + ", "
    print "KEYWORD, " + @errors[:KEYWORD].to_s.delete(",") + ", "
    print "FUNCTION, " + @errors[:FUNCTION].to_s.delete(",") + ", "
    print "METHOD, " + @errors[:METHOD].to_s.delete(",") + ", "
    print "DATABASE, " + @errors[:DATABASE].to_s.delete(",") 
    print "\n"
  end

  def to_cvs
    print @id.to_s + ", " + @status + ", " ; print_errors
  end

  def successful?
    if @errors[:SEXP].size == 0 and @errors[:KEYWORD].size == 0 and @errors[:FUNCTION].size == 0 and @errors[:METHOD].size == 0 and @errors[:DATABASE].size == 0 then
      true
    else
      false
    end
  end

end

class Stats

  def initialize()
  
    @validations = Hash.new
    #---------- Local Variables ---------------#
    @num_apps = 0 
    @apps_w_custom = 0
    @total_validators = 0
    @num_custom = 0

    #--other types---#
    @num_associations = 0
    @num_model_defined = 0
    @num_builtin = 0
    @num_validator = 0
    @num_unknown = 0

    #--status of validations -- #
    @successful = 0
    @keyword = 0; @keyword_h = Hash.new {|hash, key| hash[key] = 0}
    @function = 0; @function_h = Hash.new {|hash, key| hash[key] = 0}
    @sexp = 0; @sexp_h = Hash.new {|hash, key| hash[key] = 0}
    @method = 0
    @database = 0
    @unknown = 0
    #---------------------------#
  end

  def plus_one(type)
    case type
      when "association" then @num_associations = @num_associations + 1
      when "builtin" then @num_builtin = @num_builtin + 1
      when "unknown" then @num_unknown = @num_unknown + 1
      when "validator" then @num_validator = @num_validator + 1; @num_custom = @num_custom + 1
      when "model_defined" then @num_model_defined = @num_model_defined + 1; @num_custom = @num_custom + 1
    end
    @total_validators = @total_validators + 1 
  end 

  def plus_one_app
    @num_apps = @num_apps + 1
  end

  def plus_one_custom
    @apps_w_custom = @apps_w_custom + 1
  end

  def add(id)
    validation = Validation.new(id)
    @validations.merge!(id => validation) 
  end

  def crunch
    @validations.each_value do |validation|
      unless validation.get_sexp.empty?
        @sexp = @sexp + 1
        validation.get_sexp.each do |sexp|
          if @sexp_h.include? sexp then 
            @sexp_h[sexp] = @sexp_h[sexp] + 1 
          else 
            @sexp_h[sexp] = 1
          end
        end
      end
      unless validation.get_keyword.empty?
        @keyword = @keyword + 1
        validation.get_keyword.each do |sexp|
          if @sexp_h.include? sexp then 
            @keyword_h[sexp] = @keyword_h[sexp] + 1 
          else 
            @keyword_h[sexp] = 1
          end
        end
      unless validation.get_function.empty?
        @function = @function + 1
        validation.get_function.each do |sexp|
          if @function_h.include? sexp then 
            @function_h[sexp] = @function_h[sexp] + 1 
          else 
            @function_h[sexp] = 1
          end
        end
       end
      end

      unless validation.get_method.empty?
        @method = @method + 1
      end

      unless validation.get_unknown.empty?
        @unknown = @unknown + 1
      end

      if validation.successful? then @successful = @successful + 1 end
      @sorted_sexp = @sexp_h.sort
      @sorted_keyword = @keyword_h.sort
      @sorted_function = @function_h.sort
    end
  end

  def add_error(array)
    validation = @validations[array[0]]
    validation.add_error(array[1].to_sym, array[2])
  end

  def inspect_stat(stat)
    puts stat.to_s + " or " + ((stat * 100) / @total_validators).to_s + "%"
  end

  def output_stats()
    puts "=========== Overview statistics ============="
    puts "Number of rails applications: " + @num_apps.to_s
    puts "Numer of apps with custom validations " + @apps_w_custom.to_s
    puts "Total validation methods: " + @total_validators.to_s
    print "Total number of custom defined validation methods: "; inspect_stat(@num_custom)
    puts ""
    puts "=========== Non-custom validations breakdown ============"
    print "Total association validations (Those that occur when a has_many is used): "; inspect_stat(@num_associations)
    print "Total builtin validations: "; inspect_stat(@num_builtin)
    print "Total unknown validations: "; inspect_stat(@num_unknown)
    puts ""
    puts "=========== Custom defined validations breakdown ==========="
    print "Total validations defined as Validators: "; inspect_stat(@num_validator)
    print "Total validations defined in model: "; inspect_stat(@num_model_defined)
    puts ""
    puts "=========== Breakdown of custom validator types ============="
    puts "Number of successfully translated validators: " + @successful.to_s + " (" +  (@successful * 100 / @num_custom).to_s + "%)"
    puts "Number of unsuccessfully translated validators: " + (@num_custom - @successful).to_s 
    puts "Number of validators with errors related to... "
    puts "   1. Keyword: " + @keyword.to_s
    puts "   2. Function: " + @function.to_s
    puts "   3. S-Expression: " + @sexp.to_s
    puts "   4. External Method: " + @method.to_s
    puts "   5. Database: " + @database.to_s
    puts "   6. Unknown: " + @unknown.to_s
    puts ""
    puts "=========== Most common S-Expression failures ============= "

    i = 0
    while i < LIMIT and @sorted_sexp[i]
      puts "      " + @sorted_sexp[i][0].to_s + " ----- " + @sorted_sexp[i][1].to_s 
      i = i + 1
    end
    puts ""
    puts "=========== Most common Keyword failures ============= "

    i = 0
    while i < LIMIT and @sorted_keyword[i]
      puts "      " + @sorted_keyword[i][0].to_s + " ------ " + @sorted_keyword[i][1].to_s 
      i = i + 1
    end 
    puts ""
    puts "=========== Most common Function failures ============= "

    i = 0
    while i < LIMIT and @sorted_function[i]
      puts "      " + @sorted_function[i][0].to_s + " ------ " + @sorted_function[i][1].to_s 
      i = i + 1
    end

  end


end

#=========================================================== MAIN METHOD ======================================#

data = Stats.new

# Main loop enter : For each rails app ... 
path = Dir["*/log/rsbc/"]
path.each do |path| 

  data.plus_one_app
  app_name = path.split("/")[0]
  
  if File.exists?(path + "validator_types") and File.exists?(path + "rsbc.log") then
    data.plus_one_custom

    # Import validator_types and rsbc.log into local Files
    types = File.open( path + "validator_types", 'r')
    rsbc = File.open( path + "rsbc.log", 'r')


    # Populate Hash of validations 
    # Hash:    [ ID => Attributes ] 
    # Attributes : Hash : [ Status => bool, SEXP => values, KEYWORD => values ...etc ] 

    types.each_line {|line|
      array = line.split(" ")
      id = array[0]
      case array[1]
      when "association" then data.plus_one("association")
      when "builtin" then data.plus_one("builtin")
      when "unknown" then data.plus_one("unknown")
      when "validator" then data.plus_one("validator"); data.add(array[0])
      when "model_defined" then data.plus_one("model_defined"); data.add(array[0])
      end
    }

    # Parse rsbc.log and add to validations hash appropriately
    rsbc.each_line {|line|
      array = line.split(" ")
      unless array[1] == "SUCCESS"
        data.add_error(array)
      end
    }

  # close file 
  end
end

data.crunch
puts "crunching data..."
data.output_stats


