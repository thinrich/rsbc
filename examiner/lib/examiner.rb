require "examiner/version"
require "examiner/configuration"

module Examiner
  extend Configuration

  SOURCE_ROOT = File.dirname( __FILE__ )
  RSBC_TASKS = File.join( File.dirname( __FILE__ ), '/tasks' )
end

require "examiner/runner"
require "examiner/crawler"