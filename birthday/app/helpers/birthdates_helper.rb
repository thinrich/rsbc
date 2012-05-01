module BirthdatesHelper
  Supported_funcs = [:<,:>,:==,:>=,:<=]
  Error_funcs = [:<<]
  
  def fact (x)
    if (x <= 0) 
      1
    else
      x * fact(x-1)
    end
  end


  def ruby2plato (s)
  	s = ruby2kif(s.to_ast,nil)
	s
  end

  # Takes an sexpression and the name of the toplevel variable that holds the object being validated
  #  Assumes only given one function def that takes a single argument; assigns VAR to that argument
  #  name when encounters function def.
  def ruby2kif (sexp, var)
	if sexp 
  		case sexp[0]
  		when :defn then ruby2kif(sexp[3],sexp[2][1])  #(:defn name (:args v1 v2...) stmt)
  		when :scope then ruby2kif(sexp[1],var)
  		when :block then ruby2kif(sexp[1],var)
  		when :call then rubyterm2kif(sexp, var)
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
  		else puts sexpr; raise "unknown sexpr type";  # drop any unknown things
  		end
  	end
  end

  def rubyterm2kif(sexp, var)
#  	print "rubyterm2kif("
#  	print sexp
#  	puts ")"
	if sexp
	   sexp = ruby_simplifier(sexp,var)
       case sexp[0]
       when :call then rubycall2kif(sexp,var)
       else rubyobj2kif(sexp,var)
       end
	end
  end

  
  def rubycall2kif(sexp, var)
	if sexp and sexp[0] === :call   # (:call thing op arglist)
	    if ruby_error_sink(sexp,var) then
	    	pk("false")
	    else
			op; rubyfunc2kif(sexp[2],var);  # (op
			if sexp[1] then sp; rubyterm2kif(sexp[1],var) end  # thing added to start of arglist
			args = sexp[3]
			args = args[1..args.length-1]
			args.each { |a| sp; rubyterm2kif(a,var) }  # (rest of) arglist
			cl;    # closing paren
	    end
	end
  end
 
  # simplify form-field references from x.field to "?field"
  def ruby_simplifier (sexp,var)
 	#print "\n\nruby_simplifier("
  	#print sexp
  	#puts ")\n\n"

    if sexp and var and sexp[0] === :call and sexp[1] and sexp[1][0] === :lvar \
       and sexp[1][1] === var then
    	[:lvar, "?" + sexp[2].to_s]
    else
    	sexp
    end
  end
    
  def rubyobj2kif(sexp, var)
  	if sexp
  		case sexp[0]
  		when :lvar then pk(sexp[1])
  		when :lit then pk(sexp[1])
  		when :str then qu; pk(sexp[1]); qu
  		else puts sexp; raise "unknown sexpr object: "
  		end
  	end
  end

  # whether a given sexp represents the statement "this is an error" 
  def ruby_error_sink(sexp,var) sexp and sexp[0] === :call and Error_funcs.include?(sexp[2]) end

  # output ruby function to KIF function  
  def rubyfunc2kif(f, var) 
  	case f
  	when :< then pk("lt");
  	when :> then pk("gt");
  	when :<= then pk("lte");
  	when :>= then pk("gte");
	else pk(f)
	end
  end

  # shorthands
  def qu() pk('"') end
  def op() pk("(") end
  def cl() pk(")") end
  def sp() pk(" ") end
  def pk (x) print x end
end



