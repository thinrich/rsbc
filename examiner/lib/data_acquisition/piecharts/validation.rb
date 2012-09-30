#   FIELDS ::    [ App_name ~ Model_Name ~ Validation_Name, Status, SEXP, values, KEYWORD, values, FUNCTION, values, METHOD, values, DATABASE, values, UNKNOWN, values] 
#                |----------ID----------------------------| | T/F | |--------------------------------ERRORS-----------------------------------------------------------|
class Validation
  require 'set'

  attr_accessor :plato_success, :kifstring, :num_blocks, :id, :num_true, :semantics, :errors, :index, :blocks, :location

  def initialize(id)
    @id = id 
    @errors = {:SEXP => [], :KEYWORD => [], :FUNCTION => [], :METHOD => [], :DATABASE => [], :UNKNOWN => []}
    @plato_success = false # Corresponds to if check_plato succeeded or not
    @blocks = Array.new #  where block[i] = the errors in that block (a Set) and i = the block number
    @semantics = []	# entries correspond to the block that has the semantic error (adds nothing to :errors)
    @successful_blocks = []  	# entries correspond to the block that was succesfully translated end
  end
  
  def init_blocks(size)
    @blocks = Array.new(size)
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

  def get_num_semantics
    if @semantics.empty? then 0 else @semantics.size end
  end

  def get_num_true_blocks
    if @successful_blocks.empty? then 0 else @successful_blocks.size end
  end

  def successful_blocks?
    return !@successful_blocks.empty?
  end
 
  def semantic_blocks?
    return !@semantics.empty?
  end

  def add_error(type, value, block)
    if type == :FAILURE then
      @kifstring = value
    elsif type == :UNKNOWN then 
      @errors[type] << value
    else
      @errors[type] << value
      if @blocks[block] then 
        @blocks[block] << [type, value]
      else 
        @blocks[block] = Set.new 
        @blocks[block] << [type, value]
      end
    end
  end

  #testing 
  def output_error_set
    for i in 0..@blocks.size-1
      puts @blocks[i].inspect
    end
  end

  def print_errors
    puts "SEXP: " + @errors[:SEXP].to_s.delete(",") 
    puts "KEYWORD: " + @errors[:KEYWORD].to_s.delete(",")
    puts "FUNCTION: " + @errors[:FUNCTION].to_s.delete(",")
    puts "METHOD: " + @errors[:METHOD].to_s.delete(",")
    puts "DATABASE: " + @errors[:DATABASE].to_s.delete(",")
    puts "UNKNOWN: " + @errors[:UNKNOWN].to_s.delete(",") 
    puts "Kifstring: " + @kifstring.to_s 
  end

  def block_analyze
    for i in 0..@blocks.size-1
      if @blocks[i].nil? or @blocks[i].empty? 
        @successful_blocks << i
      end
    end
  end

  def add_unknown_semantic(block_num)
    @semantics << block_num
  end

  def display_blocks
    puts "====== Blocks in " + @id.to_s
    puts @successful_blocks.size.to_s + " out of " + @num_blocks.to_s + " had no errors"
    @successful_blocks.each do |block|
      puts "Block " + block.to_s + " was successfuly translated"
    end
    @semantics.each do |block|
      puts "Block " + block.to_s + " added nothing to the errors array"
    end

  end

  def has_no_errors
    if @errors[:SEXP].empty? and @errors[:KEYWORD].empty? and @errors[:FUNCTION].empty? and \
      @errors[:METHOD].empty? and @errors[:DATABASE].empty? and @errors[:UNKNOWN].empty? then 
      true
    else
      false
    end
  end

  def successful?
    if has_no_errors and @plato_success then 
      true
    else
      false
    end
  end

end
