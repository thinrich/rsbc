module RsbcHelper

  require 'set'
  Supported_funcs = [:<,:>,:==,:>=,:<=, :-, :+, :*, :/]
  Database_calls = [:find, :find_by_sql, :find_all, :find_first, :find_last, :where, :all, :delete, :delete_all, :destroy, :destroy_all,
                    :exists?, :get_primary_key, :last, :inspect, :reset_column_information, :reset_columns, :reset_pimary_key, :reset_counters,
                    :reset_subclasses, :rest_table_name, :set_primary_key, :set_readonly_option!, :set_sequence_name, :set_table_name, 
                    :set_inheritance_column, :table_exists?, :update, :update_all]

  Temp_filename = "/tmp/constraints"
  Plato_path = "~/Research/rsbc/externals/clicl/bin/clicl"
  Outdir = "#{Rails.root}/app/assets/javascripts/"    
  @@vars = Set.new()

  # For logging errors 
  File.open("#{Rails.root}/log/rsbc/rsbc.log", 'a')
  @@rsbc_logger ||= Logger.new("#{Rails.root}/log/rsbc/rsbc.log")

  # Get models
  Dir.glob("#{Rails.root}" + '/app/models/*.rb').each { |file| require file }
  @@models = ActiveRecord::Base.send :subclasses
  @@models.collect! {|x| x.name.to_sym }

  # mimic_server_side_validation(Birthdate) # Logs errors to /log/rsbc.log # puts validation js in /app/assets/javascripts/client
  def mimic_server_side_validation(model)
    # convert validator code to logic (KIF) and generate JS validation code
    puts "now working on #{model}"
    @model = model
    validations = get_validations(model)
    validations = remove_unwanted(validations)  # We only want custom defined validations 
    kifstring = ""
    validations.each do |validator| 
      if validator.class == Proc then mimic_on_proc(validator) else
      @owner = validator.owner
      @method_name = validator.name
      if validator.methods.include? :source_location then log_location(validator.source_location) end
      begin 
        puts @owner.to_s + " " + @method_name.to_s
        kifstring = kifstring + ruby2plato(validator)[0]
        puts kifstring
          if check_plato(kifstring) then log_success() else log_failure(kifstring) end
      rescue Exception => exc      # May want to my more explicit and include cases for differant exceptions to make logs more useful
        log_unknown(exc)
      end
      end
    end

    #### TESTING 
#    kifstring =   " (=> (not (== (+ ?adults ?children ) ?travelers)) false)" 
    #### TESTING 

    # Produce the JS 
    validfile = Outdir + model.name + "_validation.js"    # This is plato's output
    helperfile = Outdir + model.name + "_rsbchelper.js"   # Contains the type checking information 
    if check_plato(kifstring) and !kifstring.empty?
      invoke_plato(kifstring,validfile)
      create_helpers(model,@@vars,helperfile) 
    end

    puts @@vars.inspect
    @@vars.clear
    return [validfile,helperfile]
  end

  # Run the translator on a Proc, this is usually the case when a validator is inside a gem 
  def mimic_on_proc(validator)
    if validator.methods.include? :source_location 
      @owner = get_gem(validator) 
      @method_name = validator.source_location[1]
      if validator.methods.include? :source_location then log_location(validator.source_location) end
      begin 
        kifstring = ruby2plato(validator)[0]
        if check_plato(kifstring) then log_success() else log_failure(kifstring) end
          rescue Exception => exc      # May want to my more explicit and include cases for differant exceptions to make logs more useful
        log_unknown(exc)
      end
    else 
      puts "Runtime Error: Procs not supported in ruby 1.8.7 at this time." 
    end
  end

  # Gets the gem that the Proc is located in. This is a hacky way of doing it and might not hold up for all cases.
  def get_gem(p)  # p is the proc
    gem = ""
    array = p.source_location[0].split("/")
    array[array.size-1].split(".")[0].split("_").each do |x| gem << x.capitalize end 
    begin
    if eval(gem) then return eval(gem) else log_unknown(gem) end
    catch Exception => exc
      puts exc
    end
  end

  # Grabs all validation methods used in the model or defined in a vaildator used by the model
  # Returns an array of UnboundMethods
  def get_validations(model)
    validators = model._validate_callbacks.map {|callback| callback.raw_filter}     # Gives the Validators or the symbols (name of model defined validation methods) 
    model_method_names = validators.collect {|x| if x.class == Symbol then x end }  # example would be   :validate_month
    model_method_names.delete_if{|x| x == nil }             
    gem_validators = validators.collect {|x| if x.instance_values["block"] then x.instance_values["block"]  end}  # Returns a Proc with the validation code
    gem_validators.delete_if {|x| x == nil }
    validators.delete_if {|x| x.instance_values["block"] }
    validators.delete_if {|x| x.class == Symbol }                                   # separating the model validations and the validator validations
    methods = get_methods(validators)
    model_method_names.each do |def_name| methods << model.instance_method(def_name) end     #    Building array of UnboundMethods -----/ 
    methods.concat gem_validators
    return methods
  end
 
  # Methods can be either :validate or :validate_each 
  def get_methods(validators) 
    methods = []
    validators.each do |v| 
      if v.class.instance_method(:validate).methods.include? :source_location
        if v.class.instance_method(:validate).source_location[0].include? "active_model/validator.rb" and v.class.instance_methods.include? :validate_each then 
          methods << v.class.instance_method(:validate_each)
        else       
          methods << v.class.instance_method(:validate)
        end 
      else
        methods << v.class.instance_method(:validate)  # default / this happens in ruby 1.8.7 becuase the 'source_location' method is not included until 1.9.3
      end
    end
    methods  # return 
  end

  # used to only grab Validators and Explicitly defined validations in the model
  def remove_unwanted(validators)
    validators.delete_if {|x| x.to_s.include? "validate_associated_records_for" }
    validators.delete_if {|x| x.to_s.include? "ActiveModel::Validations" or x.to_s.include? "ActiveRecord::Validations" }
    validators.delete_if {|x| if x.public_methods.include? :owner then x.owner != @model and !(x.owner < ActiveModel::Validator) end } 
  end

  def create_helpers(model,vars,filename)
    h = Hash.new  # hash keyed on string of field name
    m_name = model.name.downcase
    model.columns.map {|x| h[x.name]=x.type}
    f = File.new(filename, "w")
    f.puts "function sanitize(field) {"
    f.puts "  var val = $(\"input##{m_name}_\" + field ).val();"
    f.puts "  if(!val){val = $(\"select##{m_name}_\" + field ).val();}"  # If not an input, try a select tag 
    f.puts "  switch(field) {"
    # note that vars is a set of symbols
    vars.each {|v| f.print "    case '#{v}': return "
             f.print(rails_type_to_js_typecast(h[v.to_s]))
             f.puts "(val);" }
    f.puts "    otherwise: return val;"
    f.puts "  }"
    f.puts "}"

    # Fields in the model that need validating 
    f.print "var fields = ["
    vars.each {|v| f.print " '#{v}',"}
    f.puts "];"


    # Plato needs these functions defined 
    f.puts "function hascellvalue( field ) {"
    f.puts "  var val = $( 'input##{m_name}_' + field ).val();"
    f.puts "  if(!val){val = $(\"select##{m_name}_\" + field).val(); }" 
    f.puts "  return val.length > 0; "
    f.puts "}"
    f.puts "function cellvalue( field ) {"
    f.puts "  return sanitize(field);"
    f.puts "}"

    f.puts "function validate( field, x ) {"
    f.puts "  var i = window['neg_' + field + \"_b\"].apply( this, [x_func, cellvalue( field )] );"
    f.puts "  var haserror = i instanceof expr;                                                   "
    f.puts "  if (haserror) { console.log( \"[\" + field + \"] has an error: \", i ); }           "
    f.puts "                                                                                      "
    f.puts "  var $field = $( 'input##{m_name}_' + field ).parent();                              "
    f.puts "                                                                                      "
    f.puts "  if( haserror ) {                                                                    "
    f.puts "                                                                                      "
    f.puts "    if( !$field.hasClass( 'field_with_error' ) ){                                     "
    f.puts "      $field.addClass( 'field_with_error' );                                          "
    f.puts "      $('<span/>').html( \"Error with this field\" ).appendTo( $field );              "
    f.puts "    }                                                                                 "
    f.puts "  } else {                                                                            "
    f.puts "    if( $field.hasClass( 'field_with_error' ) ) {                                     "
    f.puts "      $field.removeClass( 'field_with_error' );                                       "
    f.puts "      $field.find( 'span' ).html( \"\" );                                             "
    f.puts "    }                                                                                 "
    f.puts "  }                                                                                   "
    f.puts "  return i;                                                                           "
    f.puts "}                                                                                     "

    
    f.puts "function bind() {"
    f.puts "  $.each( fields, function( i, e ) {"
    f.puts "    console.log( 'binding ' + e );"
    f.puts "    console.log( 'input##{m_name}_' + e );"
    f.puts "    $( 'input##{m_name}_' + e ).change( e, function( evt ) {"
    f.puts "      dependent[e].mapc( validate );"
    f.puts "    });"
    f.puts "  });"
    f.puts "  $( '#new_#{m_name}' ).submit( fields, function( evt ) {"
    f.puts "    console.log( 'submission attempt' );"
    f.puts "    var valid = true;"
    f.puts "    $.each( evt.data, function( i, e ) {"
    f.puts "      var result = validate( e ) instanceof expr;"
    f.puts "      if( result ) {"
    f.puts "        valid = false;"
    f.puts "      }"
    f.puts "    });"
    f.puts "    console.log( valid );"
    f.puts "    return valid;"
    f.puts "  })"
    f.puts "}"
    f.puts "$(document).ready(function() {"
    f.puts "  bind();"
    f.puts "});"
    f.close
  end
  
  def rails_type_to_js_typecast(type)
    case type
      when :string, :text then "String"
      when :boolean then "Boolean"
      when :integer then "parseInt"
      when :decimal, :float then "parseFloat"
      else "String"
    end
  end
  
  def invoke_plato(constraints,filename)
    # constraints must be in KIF (i.e. a string)
    # convert ruby code to plato logic and write to file
    puts "#{constraints}"
    f = File.new(Temp_filename,"w")
    f.puts(constraints)
    f.close
    # probably need to change pl-fhl-to-js to maksand as needed
    # invoke plato and write results out to FILENAME
    # http://tech.natemurray.com/2007/03/ruby-shell-commands.html
    #(princ (pl-fhl-to-js '(=> (== ?month 2) (=> (not (and (gte ?day 1) (lt ?day 30)
    cmd = Plato_path + ' --eval "(progn (princ (pl-fhl-to-js (maksand (read-file \\"' + Temp_filename + '\\")))) (quit))"' + " > #{filename}" 
    #puts cmd
    system(cmd)
  end

  def check_plato(constraints)
    # dump constraints to file
    f = File.new(Temp_filename,"w")
    f.puts(constraints)
    f.close
    # Check if reader gets same as string
    #print "S-expression check:"
    cmd = Plato_path + ' --eval "(progn (handler-case (read-file \\"' + Temp_filename + '\\") (condition () (quit 1))) (quit 0))"'
    system(cmd)
    noerr = $?.success?
    #if noerr then puts "Passed" else puts "Failed" end
    if noerr then
    #puts "Plato check (if errors, transformed constraints printed, then errors printed):"
    cmd = Plato_path + ' --eval "(if (pl-fhl-to-js-check (maksand (read-file \\"' + Temp_filename + '\\"))) (quit 1) (quit 0))"'
    system(cmd)
    noerr &= $?.success?
    end
    noerr
  end

  #1.9.3p194 :254 > ruby2plato(FebValidator.instance_method(:validate))
  #(=> (== ?month 2) (=> (not (and (gte ?day 1) (lt ?day 30))) false)) => nil 
  def ruby2plato (s)
    @@plato_output = StringIO.new
    
    # Run on blocks: to restore, remove next 14 lines, uncomment ruby2kif
    ast = s.to_ast              # Grab ast 
    if ast[0] == :defn          
      vars = ast[2][1]
        if ast[3][0] == :scope and ast[3][1][0] == :block 
          block = ast[3][1]
          log_num_blocks(block.size-1)
            for i in 1..block.size-1
              log_block(i) 
              ruby2kif(block[i],vars)
              if !error_added(block[i]) then log_block_semantics(i) end
            end
        else puts "ERROR: cannot run on blocks"; log_unknown(ast)
        end
    else puts "ERROR: cannot run on blocks"; log_unknown(ast)
    end
           
    if s.class == Proc then ruby2kif(s.to_ast,nil) end
    return @@plato_output.string, @@vars
  end

  # Takes an sexpression and the name of the toplevel variable that holds the object being validated
  #  Assumes only given one function def that takes a single argument; assigns VAR to that argument
  #  name when encounters function def.
  def ruby2kif (sexp, var)
    return unless sexp 
    case sexp[0]
    when :defn then ruby2kif(sexp[3],sexp[2][1])  #(:defn name (:args v1 v2...) stmt)
    when :scope then ruby2kif(sexp[1],var)
    when :block then  parseBlock(sexp, var) #There could be more than one satement in the block 
    when :call then rubyterm2kif(sexp, var)
    when :return then pk(" "); ruby2kif(sexp[1],var)
    when :true then pk("true")
    when :false then pk("false")
    when :if  # then sexp  # (:if cond then else)
    if sexp[2]
      op; pk("=> "); ruby2kif(sexp[1],var); sp; ruby2kif(sexp[2],var); cl;
    end
    if sexp[3] # else
      op;pk("=> " ); op;pk("not "); ruby2kif(sexp[1],var);cl; sp; ruby2kif(sexp[3],var);cl
    end
 
    when :and #(:and x y)
      op; pk("and "); ruby2kif(sexp[1],var); sp; ruby2kif(sexp[2],var); cl
    when :or #(:or x y)
      op; pk("or "); ruby2kif(sexp[1],var); sp; ruby2kif(sexp[2],var); cl
    when :not #(:not x)
      op; pk("not "); ruby2kif(sexp[1],var); cl
    when :case # (:case variable case1 case2 case3.....)
      parseCase(sexp,var)
    when :array then rubyobj2kif(sexp[1],var)  #TODO this is probably bad...
    when :when then # hehe 
      ruby2kif(sexp[1],var); 
      
    else log_sexp(sexp)
    end  # throw error when found unknown operator
  end

  # Slightly hacky, if block[] has more than one statment, then we need one prefixed "and" for every two statments inside block[]inside block[]
  def parseBlock(sexp, var)
    op; pk("and")
    for i in 1..sexp.size-1
      ruby2kif(sexp[i],var)
    end
    cl
  end

  def parseCase(sexp, var)
    return if !sexp or sexp[0] != :case
    op; pk("and")
    for i in 2..sexp.size-2
     op; pk("=> "); op; pk("== "); ruby2kif(sexp[1],var); sp; ruby2kif(sexp[i][1],var); cl; ruby2kif(sexp[i][2],var); cl;
    end
    cl;
  end

  def rubyterm2kif(sexp, var)
  return unless sexp
  if ruby_error_sink(sexp) then       # Something was added to the errors array in this statment (Record is invalid) 
    pk("false")
  else
    sexp = ruby_simplifier(sexp,var)    # Translate : to ? for plato 
    case sexp[0]
    when :call then rubycall2kif(sexp,var)
      else rubyobj2kif(sexp,var) end
    end
  end

  
  def rubycall2kif(sexp, var)
  return if !sexp or sexp[0] != :call   # (:call thing op arglist)
  unless catch_nil(sexp, var) or catch_database(sexp)
    op; rubyfunc2kif(sexp,var);  # (op
    if sexp[1] then sp; rubyterm2kif(sexp[1],var) end  # thing added to start of arglist
    args = sexp[3]
    args = args[1..args.length-1]
    args.each { |a| sp; rubyterm2kif(a,var) }  # (rest of) arglist
    cl;    # closing paren
  end
  end

  # output ruby function to KIF function  
  def rubyfunc2kif(sexp, var) 
    case sexp[2]
    when :< then pk("lt");
    when :> then pk("gt");
    when :<= then pk("lte");
    when :>= then pk("gte");
    when :== then pk("==");
    when :+ then pk("+");
    when :- then pk("-"); 
    when :* then pk("*");
    when :/ then pk("/"); 
    when :nil? then log_func("nil?")
    else 
      log_func(sexp[2])
    end
  end

  # Catches the case that the call's first argument is nil in which case two things can be happening
  # 1. The call is referencing an instance variable (Through ruby's getter setter attr_accessible method) OR 
  # 2. the call is making an external method call
  # Sexp should look like: (nil, attr)
  #
  # 1.a: The variable may be a form field, in other words it may be supplied to the model via the client. If this is 
  #         the case than we should ignore these cases. We can just say that nil on the client = no value on the client.
  # 1.b: The variable is not set in the client form. This can happen when we check for an id attribute for associations. 
  #         in this case we need to use AJAX to resolve the variable, and see if it is in fact nil or not. 
  # The quesion is how to determine 1.a from 1.b
  def catch_nil(sexp, var)
    if sexp[1].nil?
      if @model.columns.map{|x| x.name.to_sym}.include? sexp[2] then   # columns = instance variables / this is the first case
          pk("?#{sexp[2]}")
          @@vars.add(sexp[2].to_s)
        return true
      else
        begin 
          ruby2kif(@owner.instance_method(sexp[2]).to_ast, var)   # attempt to make the method call / this is case 2
        rescue  Exception => exc 
          if @owner.name then log_method(@owner.name.to_s + ".instance_method(:" + sexp[2].to_s + ")") # Probably should change to EXTERNAL_METHOD_ERROR
          else log_method(sexp[2].to_s) end
        end
      return true
      end
    else
      return false
    end
  end

  # Catches the case where a database call is used
  def catch_database(sexp)
    if @@models.include? sexp[1][1] and Database_calls.include? sexp[2] 
      log_database(sexp[2])
    end
  end

 
  def rubyobj2kif(sexp, var)
    return unless sexp
    case sexp[0]
    when :lvar then pk(sexp[1])
    when :lit then pk(sexp[1])
    when :self then pk(sexp[1])
    when :str then qu; pk(sexp[1]); qu
    when :ivar then pk(sexp[1])  # TODO For now we are treating instance vars the same as local vars 
    else log_keyword(sexp)
    end
  end

  # simplify form-field references from x.field to "?field"
  def ruby_simplifier (sexp,var)
  #print "\n\nruby_simplifier("
    #print sexp
    #puts ")\n\n"

    if sexp and var and sexp[0] === :call and sexp[1] and sexp[1][0] === :lvar \
       and sexp[1][1] === var then
      @@vars.add sexp[2]
      [:lvar, "?" + sexp[2].to_s]
    elsif sexp and sexp[0] === :call and sexp[1] and sexp[1][0] === :self then
      @@vars.add sexp[2]
      [:self, "?" + sexp[2].to_s]
    elsif sexp and sexp[0] === :call and sexp[1] and sexp[1][0] === :ivar and sexp[1][1] == :@attributes then
      @@vars.add sexp[3][1][1]
      [:ivar, "?" + sexp[3][1][1]]
    else
      sexp
    end
  end
    

  # Skips over adding the error messege. The error messege does not affect the logic used in this translator
  # Possible TODO: Package up the error messege to be used on the client side
  def ruby_error_sink(sexp) 
    if sexp[0] === :call and sexp[2] === :errors then
      return true
    elsif sexp [1] and sexp[1][0] and sexp [1][0] === :call then
      ruby_error_sink(sexp[1])
    end
  end

  # Recursively tells if the sexp ever adds anything to the errors array TODO Not sure if this is exhaustive
  def error_added(sexp)
    return true if sexp.to_s.include? ":error"
  end

  # shorthands
  def qu() pk('"') end
  def op() pk("(") end
  def cl() pk(")") end
  def sp() pk(" ") end
  def pk (x) @@plato_output.print x end

  # shorthands for logging
  
  def log_location(loc) lg("LOCATION " + loc[0].to_s + " " + loc[1].to_s) end
  def log_sexp(sexp) lg("SEXP " + sexp[0].to_s ) end
  def log_keyword(sexp) lg("KEYWORD " + sexp[0].to_s ) end
  def log_func(f) lg("FUNCTION " + f.to_s  ) end
  def log_method(method) lg("METHOD " + method.to_s ) end
  def log_database(sexp) lg("DATABASE " + sexp.to_s ) end
  def log_unknown(exc) lg("UNKNOWN " + exc.to_s.delete("\n")) end
  def log_success() lg("SUCCESS") end 
  def log_failure(kifstring) lg("FAILURE " + kifstring.to_s ) end
  def log_block(i) lg("BLOCK " + i.to_s ) end
  def log_num_blocks(num) lg("NUM_BLOCKS " + num.to_s) end
  def log_block_semantics(i) lg("BLOCK_SEMANTICS " + i.to_s) end
  def lg (x) @@rsbc_logger.fatal(Rails.application.class.parent_name + "~" + @model.to_s + "~" + @method_name.to_s + " " + x) end

end
