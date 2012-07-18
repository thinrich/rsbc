# sript to parse log files in rails/log/rsbc/rsbc.log and turn it into useable stats

require( "./validation")
require( "./stats")
require( "./app_database")

LIMIT = 10  # Modify this to set how many values are listed in under sexp, function and keyword lists

#=========================================================== MAIN METHOD ======================================#
puts "type help for commands, 'q' to quit"
data = Stats.new
apps = AppDatabase.new

# Main loop: For each rails app ... 
path = Dir["../*/log/rsbc/"]
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
      case array[2]
      when "association" then data.plus_one("association")
      when "builtin" then data.plus_one("builtin"); data.classify_builtin(array[1])
      when "unknown" then data.plus_one("unknown")
      when "validator" then data.plus_one("validator"); data.add(array[0]); apps.add(array[0])
      when "model_defined" then data.plus_one("model_defined"); data.add(array[0]); apps.add(array[0])
      end
    }

    # Parse rsbc.log and add to validations appropriately
    rsbc.each_line {|line|
      data.parse_rsbc(line)
    }

  # close file 
  end
end

data.crunch

#============================ Interactive portion of program =========================
menu = gets.chomp
while !(menu == "q" || menu == "quit" || menu == "exit")
  case menu
  when 'help' then 
    puts "stats       print out general stats about all validations found"
    puts "builtins    print out info on the builtin validations"
    puts "successes   print info on validations that succeeded"
    puts "inspect     inspect a single validation, Input format: App~Model~validation "
    puts "list        list all apps, then enter app name to list models within, then enter model to list validations"

  when 'stats' then data.output_stats 
  when 'builtins' then data.output_builtins
  when 'blocks' then data.output_block_stats
  when 'successes' then 
    puts "============ Successful Validation Id's ============="
    successes = data.get_successful
    puts successes 
  when 'failures' then 
    puts "============ Failed Validation Id's ============="
    failures = data.get_failures
    puts failures 
  when 'inspect'
    print "app name?: "
    app = gets.chomp
    print "model name?: "
    model = gets.chomp
    print "validation method name?: "
    method = gets.chomp
    id = app + "~" + model + "~" + method 
    data.inspect(id)
  when 'list'
    apps.list_apps
    puts "Enter an app name to get models contained in it: "
    app = gets.chomp
    if apps.list_models(app) then 
      puts "Enter model to get validations: "
      model = gets.chomp
      apps.list_validations(app, model)
    end
  when 'query' 
    print "Enter Error type: "
    error = gets.chomp.upcase.to_sym
    print "Enter value: " 
    value = gets.chomp
    data.query(error, value)
    
  end
  menu = gets.chomp
end
