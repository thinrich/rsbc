require "examiner/version"
require "examiner/configuration"

module Examiner
  extend Configuration

  SOURCE_ROOT = File.dirname( __FILE__ )
end

require "examiner/runner"
require "examiner/crawler"