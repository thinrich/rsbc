# -*- encoding: utf-8 -*-
require File.expand_path('../lib/examiner/version', __FILE__)

Gem::Specification.new do |gem|
  gem.authors       = ["Daniel Ruiz"]
  gem.email         = ["ynnadrules@gmail.com"]
  gem.description   = %q{The Examiner is a Mass Rails App Tester}
  gem.summary       = %q{Will take some keywords, search github, install all repos matching, copy in some rake/thor tasks and gather stats about validations}
  gem.homepage      = ""

  gem.files         = `git ls-files`.split($\)
  gem.executables   = gem.files.grep(%r{^bin/}).map{ |f| File.basename(f) }
  gem.test_files    = gem.files.grep(%r{^(test|spec|features)/})
  gem.name          = "examiner"
  gem.require_paths = ["lib"]
  gem.version       = Examiner::VERSION

  gem.add_dependency 'thor'
  gem.add_dependency 'httparty'
end
