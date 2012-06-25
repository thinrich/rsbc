module BirthdatesHelper
  require 'set'
  Supported_funcs = [:<,:>,:==,:>=,:<=]
  Temp_filename = "/tmp/constraints"
  Plato_path = "~/Research/code/clir/rsbc/externals/clicl/bin/clicl"
  Outdir = "#{Rails.root}/app/assets/javascripts/"    

 #----------Might not be used ---------------
#  index = File.new(Outdir + "index.js", 'w')  # Manifest file for rails (for including all the validaitons / sanitations)
#  File.open("#{Rails.root}/app/assets/javascripts/application.js" 'a').puts "//=require client"
 #-------------------------------------------
  
  # For logging errors 
  File.open("#{Rails.root}/log/rsbc.log", 'a')
  @@rsbc_logger ||= Logger.new("#{Rails.root}/log/rsbc.log")

  # mimic_server_side_validation(Birthdate) # Logs errors to /log/rsbc.log # puts validation js in /app/assets/javascripts/client
  def mimic_server_side_validation(model)
	# convert validator code to logic (KIF) and generate JS validation code
	@model = model
	validations = get_validations(model)
	kifstring = "(and" 
	validations.each do |validator| 
		@instance_name = validator.owner
		kifstring << ruby2plato(validator)[0]
	end
	kifstring += ")"
	validfile = Outdir + model.name + "_validation.js"
	check_plato(kifstring)  # for testing
	invoke_plato(kifstring,validfile)

	# create sanitization code from model's typing info
	sanifile = Outdir + model.name + "_sanitization.js"
	create_sanitization(model,@@vars,sanifile)  # TODO Not sure if this is ok, (Using the class variable @@vars, don't think it should matter)
	return [validfile,sanifile]
  end

  # Grabs all validation methods used in the model or defined in a vaildator used by the model
  # Returns an array of UnboundMethods
  def get_validations(model)
    validators = model._validate_callbacks.map {|callback| callback.raw_filter}     # Gives the Validators or the symbols (name of model defined validation methods) 
    validators.delete_if {|x| x.to_s.include? "ActiveModel::Validations"}           # We only want custom validation methods
    model_method_names = validators.collect {|x| if x.class == Symbol then x end }  # example would be   :validate_month
    model_method_names.delete_if{|x| x == nil }					    
    validators.delete_if {|x| x.class == Symbol } 				    # separating the model validations and the validator validations
    methods = validators.map{ |validator| validator.class.instance_method(:validate) }       # -----/
    model_method_names.each do |def_name| methods << model.instance_method(def_name) end     #    Building array of UnboundMethods -----/ 
    return methods
  end

  def create_sanitization(model,vars,filename)
  	h = Hash.new  # hash keyed on string of field name
  	model.columns.map {|x| h[x.name]=x.type}
  	f = File.new(filename, "w")
  	f.puts "function sanitize(field) {"
  	f.puts '  var val = $("input[name=\"" + field + "\"]").val();'
  	f.puts "  switch(field) {"
  	# note that vars is a set of symbols
  	vars.each {|v| f.print "    case '#{v}': return "
  				   f.print(rails_type_to_js_typecast(h[v.to_s]))
  				   f.puts "(val);" }
  	f.puts "    otherwise: return val;"
  	f.puts "  }"
  	f.puts "}"
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
    print "S-expression check:"
    cmd = Plato_path + ' --eval "(progn (handler-case (read-file \\"' + Temp_filename + '\\") (condition () (quit 1))) (quit 0))"'
    system(cmd)
    noerr = $?.success?
    if noerr then puts "Passed" else puts "Failed" end
    if noerr then
        puts "Plato check (if errors, transformed constraints printed, then errors printed):"
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
        @@vars = Set.new()
  	ruby2kif(s.to_ast,nil)
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
	when :return then ruby2kif(sexp[1],var)
	when :true then pk("true")
	when :false then pk("false")
	when :if  # then sexp  # (:if cond then else)
		if sexp[2]
		  op; pk("=> "); ruby2kif(sexp[1],var); sp; ruby2kif(sexp[2],var); cl;
		end
		if sexp[3] 
	          op;pk("=> " ); op;pk("not "); ruby2kif(sexp[1],var);cl; sp; ruby2kif(sexp[3],var);cl
		end
 
	when :and #(:and x y)
		op; pk("and "); ruby2kif(sexp[1],var); sp; ruby2kif(sexp[2],var); cl
	when :or #(:or x y)
		op; pk("or "); ruby2kif(sexp[1],var); sp; ruby2kif(sexp[2],var); cl
	when :not #(:not x)
		op; pk("not "); ruby2kif(sexp[1],var); cl
  	else log_sexp(sexp, "ruby2kif"); raise "unknown sexp type"; 
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


  def rubyterm2kif(sexp, var)
	return unless sexp
	if ruby_error_sink(sexp) then
		pk("false")
 	else
	  sexp = ruby_simplifier(sexp,var)		# Translate : to ? for plato 
    	  case sexp[0]
    	  when :call then rubycall2kif(sexp,var)
    	  else rubyobj2kif(sexp,var)
          end
        end
  end

  
  def rubycall2kif(sexp, var)
	return if !sexp or sexp[0] != :call   # (:call thing op arglist)
	unless catch_nil(sexp, var)
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
	when :nil? then 
		pk("==")
		#add "null" to arglist / result being "(== thing null )" --- Don't know if this will work 
		sexp[3] << s(:lit, "null")
	else 
	  log_func(sexp[2])
		end
  end

  # Catches the case that the call's first argument is nil in which case two things can be happening
  # 1. The call is referencing an instance variable OR 2. the call is making an external method call
  def catch_nil(sexp, var)
    if sexp[1].nil?
      if @model.columns.map{|x| x.name.to_sym}.include? sexp[2] then 
	pk("?" + sexp[2].to_s)
	return true
      else
	begin 
	  ruby2kif(@instance_name.instance_method(sexp[2]).to_ast, var)
	rescue log_unknown(@instance_name.instance_method(sexp[2]))  # Probably should change to EXTERNAL_METHOD_ERROR
	end
	return true
      end
    else
      return false
    end
  end
 
  def rubyobj2kif(sexp, var)
  	return unless sexp
  	case sexp[0]
  	when :lvar then pk(sexp[1])
  	when :lit then pk(sexp[1])
	when :self then pk(sexp[1])
  	when :str then qu; pk(sexp[1]); qu
	when :ivar then pk(sexp[1].to_s.delete("@"))  #------> TODO This might not work
  	else log_sexp(sexp, "rubyobj2kif" ); raise "unknown sexpr object: "
  	end
  end

  # simplify form-field references from x.field to "?field"
	#TODO must extend ivar
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


  # shorthands
  def qu() pk('"') end
  def op() pk("(") end
  def cl() pk(")") end
  def sp() pk(" ") end
  def pk (x) @@plato_output.print x end

  # shorthands for logging
  def log_sexp(sexp, method) lg("ERROR: keyword " + sexp[0].to_s + "  has no translation. In validator " + @method_name.to_s + "#" + @instance_name.to_s  ) end
  def log_func(f) lg("ERROR: Function " + f.to_s + " has no translation. in validator " + @method_name.to_s + "#" + @instance_name.to_s ) end
  def log_unknown(sexp) lg("UNKNOWN: " + sexp.to_s + " raised an error") end
  def lg (x) @@rsbc_logger.fatal(x) end
   

end
