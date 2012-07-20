#   FIELDS ::    [ App_name ~ Model_Name ~ Validation_Name, Status, SEXP, values, KEYWORD, values, FUNCTION, values, METHOD, values, DATABASE, values, UNKNOWN, values] 
#                |----------ID----------------------------| | T/F | |--------------------------------ERRORS-----------------------------------------------------------|
class Validation

  attr_accessor :success, :kifstring, :num_blocks, :id, :num_true, :semantics, :errors

  def initialize(id)
    @id = id 
    @errors = {:SEXP => [], :KEYWORD => [], :FUNCTION => [], :METHOD => [], :DATABASE => [], :UNKNOWN => []}
    @success = false # Corresponds to if check_plato succeeded or not
    @blocks = Array.new
    @semantics = 0
    @num_true = 0
  end
  
  def init_blocks(size)
    @blocks = Array.new(size, [])
    @num_blocks = size
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

  def add_error(type, value, block)
    if type == :FAILURE then
      @kifstring = value
    elsif type == :UNKNOWN then 
      @errors[type] << value
    else
      @errors[type] << value
      @blocks[block] << [type, value]
    end
  end

  def add_unknown_semantic(block_num)
    @blocks[block_num] = "UNKNOWN SEMANTICS"
  end
  
  def print_errors
    puts @id
    puts "SEXP: " + @errors[:SEXP].to_s.delete(",") + ", "
    puts "KEYWORD: " + @errors[:KEYWORD].to_s.delete(",") + ", "
    puts "FUNCTION: " + @errors[:FUNCTION].to_s.delete(",") + ", "
    puts "METHOD: " + @errors[:METHOD].to_s.delete(",") + ", "
    puts "DATABASE: " + @errors[:DATABASE].to_s.delete(",") 
    puts "Kifstring: " + @kifstring.to_s 
  end

  def block_analyze
    for i in 0..@blocks.size-1
      if @blocks[i].empty? && @blocks[i] != "UNKNOWN SEMANTICS"
        @num_true = @num_true + 1
      elsif @blocks[i] == "UNKNOWN SEMANTICS"
        @semantics = @semantics + 1
      end
    end
  end

  def display_blocks
    puts "====== Blocks in " + @id.to_s
    puts @num_true.to_s + " out of " + @num_blocks.to_s + " had no errors"
    puts @semantics.to_s + " did not add anything to the errors array"
  end

  def successful?
    if @errors[:SEXP].size == 0 and @errors[:KEYWORD].size == 0 and @errors[:FUNCTION].size == 0 \
    and @errors[:METHOD].size == 0 and @errors[:DATABASE].size == 0 and @errors[:UNKNOWN].size == 0 and @success then 
      true
    else
      false
    end
  end

end
