class Stats

  def initialize()
  
    @validations = Hash.new  #[ id => validation ]
    @val_indexable = Array.new  # for easy query using an index number
    @current_index = 0
    @apps = AppDatabase.new  # stores an easy to navigate database of apps which have models which have validaitons
    @block = 0  # for keeping track of which is currently being analyzed
    @id = "" # for keeping track of the current validation

    #---------- Overview Variables ---------------#
    @num_apps = 0 
    @apps_w_custom = 0
    @total_validators = 0
    @num_custom = 0

    #---------- Block stats ----------------------#
    @num_blocks = 0
    @num_blocks_successful = 0
    @num_blocks_unknown = 0

    #--other types---#
    @num_associations = 0  #TODO Differentiate types
    @num_model_defined = 0
    @num_builtin = 0
    @num_validator = 0
    @num_unknown = 0
    @num_gem = 0

    #--Types of builtins--#
    @num_acceptance = 0
    @num_associated = 0
    @num_confirmation = 0
    @num_exclusion = 0
    @num_format = 0
    @num_inclusion = 0
    @num_length = 0
    @num_numericality = 0
    @num_presence = 0
    @num_uniqueness = 0
    @num_validates_with = 0
    @num_validates_each = 0

    #--status of validations -- #  These hold the number of VALIDATAIONS with errors regarding the following (not the number of occurances)
    #--the *_h holds the number of occurances of each kind of error
    @successful = 0
    @keyword = 0; @keyword_h = Hash.new {|hash, key| hash[key] = 0}
    @function = 0; @function_h = Hash.new {|hash, key| hash[key] = 0}
    @sexp = 0; @sexp_h = Hash.new {|hash, key| hash[key] = 0}
    @method = 0; @method_h = Hash.new {|hash, key| hash[key] = 0}
    @database = 0; @database_h = Hash.new {|hash, key| hash[key] = 0}
    @unknown = 0; @unknown_h = Hash.new {|hash, key| hash[key] = 0}
    #---------------------------#
  end

  # Takes a line from the rsbc.log file and adds the fields to the correct validation that the line represents
  def parse_rsbc(line)
    array = line.split(" ") 
    validation = @validations[array[0]]
    if array[1] == "FAILURE" 
      array.delete_at(0); 
      type = array.delete_at(0)
      value = array.join(" ")
      validation.add_error(type.to_sym, value, @block-1)
    elsif array[1] == "SUCCESS" then validation.plato_success = true;
    elsif array[1] == "BLOCK" then @block = array[2].to_i;
    elsif array[1] == "NUM_BLOCKS" then validation.init_blocks(array[2].to_i);
    elsif array[1] == "BLOCK_SEMANTICS" then validation.add_unknown_semantic(@block);
    elsif array[1] == "LOCATION" then validation.location = array[2].to_s + " " + array[3].to_s
    else
    #  begin 
        validation.add_error(array[1].to_sym, array[2] , @block-1)
    #  rescue Exception => exc
    #    print "Runtime Error: " + exc.to_s + " from: " + validation.id + "\n"
    #  end
    end
  end

  # just an incrementer (For lack of a better way, I'm not sure if ruby has one)
  def plus_one(type)
    case type
      when "association" then @num_associations = @num_associations + 1
      when "builtin" then @num_builtin = @num_builtin + 1
      when "unknown" then @num_unknown = @num_unknown + 1
      when "validator" then @num_validator = @num_validator + 1; @num_custom = @num_custom + 1
      when "model_defined" then @num_model_defined = @num_model_defined + 1; @num_custom = @num_custom + 1
      when "gem" then @num_gem = @num_gem + 1
    end
    @total_validators = @total_validators + 1 
  end 

  def classify_builtin(type) 
    if type.include? "AcceptanceValidator" then @num_acceptance = @num_acceptance + 1 
    elsif type.include? "ConfirmationValidator" then @num_confirmation = @num_confirmation + 1
    elsif type.include? "AssociatedValidator" then @num_associated = @num_associated + 1
    elsif type.include? "ExclusionValidator" then @num_exclusion = @num_exclusion + 1 
    elsif type.include? "FormatValidator" then @num_format = @num_format + 1 
    elsif type.include? "InclusionValidator" then @num_inclusion = @num_inclusion + 1 
    elsif type.include? "LengthValidator" then @num_length = @num_length + 1 
    elsif type.include? "NumericalityValidator" then @num_numericality = @num_numericality + 1 
    elsif type.include? "UniquenessValidator" then @num_uniqueness = @num_uniqueness + 1 
    elsif type.include? "PresenceValidator" then @num_presence = @num_presence + 1 
    else puts "NOT CLASSIFIED: " + type.to_s + "Add to classify_builtin method inside piecharts.rb"
    end

  end

  def output_successful_blocks
    @validations.each_value do |validation|
      if validation.successful_blocks? then print validation.id.to_s + " index: " + validation.index.to_s + "\n" end
    end
  end

  def output_semantic
    @validations.each_value do |validation|
      if validation.semantic_blocks? then print validation.id.to_s + " index: " + validation.index.to_s + "\n" end
    end
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
    validation.index = @current_index
    @val_indexable << validation
    @current_index = @current_index + 1
  end

  def crunch

    # Analyze blocks 
    @validations.values.each do |validation| 
      validation.block_analyze
      if validation.num_blocks then @num_blocks = @num_blocks + validation.num_blocks end
      @num_blocks_successful = @num_blocks_successful + validation.get_num_true_blocks
      @num_blocks_unknown = @num_blocks_unknown + validation.get_num_semantics
    end

    # count the errors 
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
          if @keyword_h.include? sexp then 
            @keyword_h[sexp] = @keyword_h[sexp] + 1 
          else 
            @keyword_h[sexp] = 1
          end
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
      unless validation.get_database.empty?
        @database = @database + 1
        validation.get_database.each do |sexp|
          if @database_h.include? sexp then 
            @database_h[sexp] = @database_[sexp] + 1 
          else 
            @database_h[sexp] = 1
          end
        end
      end

      unless validation.get_method.empty?
        @method = @method + 1
        validation.get_method.each do |sexp|
          if @method_h.include? sexp then 
            @method_h[sexp] = @method_h[sexp] + 1 
          else 
            @method_h[sexp] = 1
          end
        end
      end
      unless validation.get_unknown.empty?
        @unknown = @unknown + 1
        validation.get_unknown.each do |sexp|
          if @unknown_h.include? sexp then 
            @unknown_h[sexp] = @unknown_h[sexp] + 1 
          else 
            @unknown_h[sexp] = 1
          end
        end
      end

      # Find most common errors 
      if validation.successful? then @successful = @successful + 1 end
      @sorted_sexp = @sexp_h.sort{|key, value| -1*(key[1] <=> value[1]) }
      @sorted_keyword = @keyword_h.sort{|key, value| -1*(key[1] <=> value[1]) }
      @sorted_function = @function_h.sort{|key, value| -1*(key[1] <=> value[1])}
      @sorted_method = @method_h.sort{|key, value| -1*(key[1] <=> value[1])}
      @sorted_database = @database_h.sort{|key, value| -1*(key[1] <=> value[1])}
      @sorted_unknown = @unknown_h.sort{|key, value| -1*(key[1] <=> value[1])}

    end
  end

  def inspect_stat(stat)
    puts stat.to_s + " or " + ((stat * 100) / @total_validators).to_s + "%"
  end

  def inspect(index)
    puts ""
    if val = @val_indexable[index.to_i]
      puts "ID: " + val.id.to_s
      puts "Location: " + val.location.to_s
      puts "Successful?: " + val.plato_success.to_s
      puts "Number of blocks: " + val.num_blocks.to_s
      val.print_errors
      val.display_blocks
      val.output_error_set
    else
      puts "Validation not found with id: " + index.to_s 
    end
  end

  def custom_validators
    puts "Custom validators"
    @validations.values.each do |validator| 
      validator.print_errors
    end 
  end

  def get_successful
    successes = []
    @validations.each {|id, validation| successes << id.to_s + " index:" + validation.index.to_s  if validation.successful? == true}
    successes
  end
  
  def get_failures
    failures = []
    @validations.each {|id, validation| failures << id.to_s + " index: " + validation.index.to_s if validation.successful? == false}
    failures
  end

  def query(error, value)
    vals = []
    @validations.values.each do |validation| 
      if validation.errors[error].include? value then 
        vals << validation
      end
    end
    for i in 0..vals.size-1
      print vals[i].id + " index: " + vals[i].index.to_s + "\n"
    end
    vals
  end

  # Quadratic time (Eww) that populates an array of blocks (synonomous with error subset) sorted by their priority
  # Priority: based on 'if we fixed this subset of errors, we would solve the most # of blocks'
  def output_priority
    priority = Hash.new # where priority[id] = block id's priority 
    error_set = Hash.new # where error_set[id] = block id's error set
    
    # init error_set to contain all the blocks
    @validations.values.each do |validation|
      for i in 0..validation.blocks.size-1
        unless validation.blocks[i].class != Set 
          id = validation.id.to_s + "~" + i.to_s 
          error_set.merge!(id => validation.blocks[i])
          priority.merge!(id => 1)
        end
      end
    end

    error_set.keys.each do |key| 
      error_set.keys.each do |other|  # QUADRATIC
        unless key == other
          if error_set[key].difference(error_set[other]).empty? then priority[other] = priority[other] + 1 end # key is a subest of other so other's priority increases
        end
      end
    end

    sorted = priority.sort{|key, value| -1*(key[1] <=> value[1]) }  

    i = 0
    puts "========= Priority by block-error-set ========"
    puts sorted[i].class
    while i < LIMIT and sorted[i]
      id = sorted[i][0]
      print sorted[i][1].to_s + " blocks will be successful if you fix:  "
      puts id.to_s
      error_set[id].each do |error|
        print "          " + error.to_s.delete("[").delete("]")
        puts ""
      end
      i = i + 1

      
    end
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
    print "Total validations defined in gem: "; inspect_stat(@num_gem)
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
    puts "Enter 1-6 for more info on above " 
  end
  
  def output_sexp
    puts "=========== Most common Sexp failures ============= "

    i = 0
    while i < LIMIT and @sorted_sexp[i]
      puts "   " + @sorted_sexp[i][1].to_s + " occurrences ----- " + @sorted_sexp[i][0].to_s 
      i = i + 1
    end
    puts ""
  end

  def output_keyword
    puts "=========== Most common Keyword failures ============= "

    i = 0
    while i < LIMIT and @sorted_keyword[i]
      puts "   " + @sorted_keyword[i][1].to_s + " occurrences ------ " + @sorted_keyword[i][0].to_s 
      i = i + 1
    end 
    puts ""
  end

  def output_function
    puts "=========== Most common Function failures ============= "

    i = 0
    while i < LIMIT and @sorted_function[i]
      puts "   " + @sorted_function[i][1].to_s + " occurrences ------ " + @sorted_function[i][0].to_s 
      i = i + 1
    end
    puts ""
  end

  def output_database
    puts "=========== Most common Database failures ============= "

    i = 0
    while i < LIMIT and @sorted_database[i]
      puts "   " + @sorted_database[i][1].to_s + " occurrences ------ " + @sorted_database[i][0].to_s 
      i = i + 1
    end
    puts ""
  end

  def output_unknown
    puts "=========== Most common Unknown failures ============= "

    i = 0
    while i < LIMIT and @sorted_unknown[i]
      puts "   " + @sorted_unknown[i][1].to_s + " occurrences ------ " + @sorted_unknown[i][0].to_s 
      i = i + 1
    end
    puts ""
  end

  def output_method
    puts "=========== Most common Method failures ============= "

    i = 0
    while i < LIMIT and @sorted_method[i]
      puts "   " + @sorted_method[i][1].to_s + " occurrences ------ " + @sorted_method[i][0].to_s 
      i = i + 1
    end
    puts ""
  end


  def output_builtins
    puts "=========== Builtins breakdown ====================="
    puts "Number or Acceptance: " + @num_acceptance.to_s
    puts "Number of Associated: " + @num_associated.to_s
    puts "Number of Confirmation: " + @num_confirmation.to_s
    puts "Number of Exclusion: " + @num_exclusion.to_s
    puts "Number of Format: " + @num_format.to_s
    puts "Number of Inclusion: " + @num_inclusion.to_s
    puts "Number of Length: " + @num_length.to_s
    puts "Number of Numericality: " + @num_numericality.to_s
    puts "Number of Presence: " + @num_presence.to_s
    puts "Number of Uniqueness: " + @num_uniqueness.to_s
    puts "Number of ValidatesWith: " + @num_validates_with.to_s
    puts "Number of ValidatesEach: " + @num_validates_each.to_s
    
  end

  def output_block_stats
    
    puts "=============== Stats by Blocks ==================="
    puts "Total blocks: " + @num_blocks.to_s
    puts "Successfully translated blocks: " + @num_blocks_successful.to_s + " (" +  (@num_blocks_successful * 100 / @num_blocks).to_s + "%)" 
    puts "Unknown semantics blocks: " + @num_blocks_unknown.to_s
    puts ""
    puts "To view validaions that contain the above enter either 'blocks-success' or 'blocks-semantic'"
  end

  def output_plato_only
    
    puts "========== blocks with no translation problems but where plato fails ============="

    @validations.values.each do |validation| 
      if validation.has_no_errors and !validation.successful? then 
        puts validation.id
      end
    end

  end
end
