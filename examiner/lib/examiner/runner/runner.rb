require 'thor'
require 'active_support/core_ext/object'
module Examiner
  class Runner < Thor
    include Thor::Shell
    include Thor::Actions

    source_root Examiner::SOURCE_ROOT

    class_option :basedir, aliases: "-d", desc: "Specify base dir", default: Dir.pwd
    class_option :interactive, aliases: "-i", type: :boolean, desc: "Interactive mode", default: false

    desc "examine [options]", "Run the examiner to checkout ruby on rails apps from github and perform some emperical testing on them"
    def examine
      
    end

    desc "search KEYWORDS", "search github repos by keywords"
    method_option :language, aliases: "-l", default: "ruby", desc: "Refine by language"
    method_option :start_page, aliases: "-p", desc: "Start from page n"
    method_option :store, aliases: "-s", type: :boolean, default: true, desc: "Store results to file, specify basedir with -d"
    # method_option :basedir, aliases: "-d", desc: "Specify base dir", default: Dir.pwd
    ### TODO: determine how to handle the keywords with spaces

    def search( keyword )
      say_status "Searching with keywords", keyword, true
      say_status "Apps written in", options[:language].capitalize, true
      say_status "Offseting with page", options[:start_page], true unless options[:start_page].nil?

      #keywords = keywords.join( "+" )

      request = "#{Examiner.github_search_uri}/#{keyword}?#{options.to_query}"

      if options[:store]
        invoke :prepare, [], basedir:options[:basedir]
        inside 'examiners_room', verbose: true do
          get request, "repos.json"
        end
      else
        params = { keywords: keyword }
        puts Crawler.search params.merge!( options )
      end

    end

    desc "prepare", "makes needed directory structures for tests"
    # method_option :basedir, aliases: "-d", desc: "Specify base dir", default: Dir.pwd
    def prepare
      destination_root = options[:basedir]
      say_status :preparing, "workspace", true
      inside 'examiners_room', verbose:true do
        empty_directory "apps", verbose:true
        empty_directory "reports", verbose:true
        empty_directory "logs", verbose:true
      end
    end

    desc "execute", "executes the tests"
    # method_option :basedir, aliases: "-d", desc: "Specify base dir", default: Dir.pwd
    method_option :rails_env, aliases: "-e", desc: "Specify rails env", default: "development"
    method_option :how_many, type: :numeric, aliases: "-n", default: 1, desc: "How many tests to execute"
    def execute
      destination_root = options[:basedir]

      say_status :executing, "the tests", true

      inside 'examiners_room/apps', verbose:true do |dest_root|
        say_status :loading, "the repo json file", true
        json = JSON.load( File.open( "../repos.json" ) )

        if json.has_key? "repositories"
          how_many = options[:how_many] || json["repositories"].count
          json["repositories"].take( how_many ).each do |repo|

            if options[:interactive]
              no = no?( "Does #{repo["name"]} look viable?" )

              if File.exists?( )
                say_status :skipping, repo["name"]
                next
              end
            end

            say_status :cloning, repo["name"], true
            url = "#{repo["url"]}.git"

            run "git clone #{url}", verbose: true unless File.exists?( "#{dest_root}/#{repo["name"]}")

            if !File.exists?( "#{dest_root}/#{repo["name"]}/app" )
              say_status :skipping, "#{repo["name"]} is not an app, it's probably just a gem or some other thing", verbose: true
              run "rm -rf #{dest_root}/#{repo["name"]}", verbose: true
              next
            end

            inside repo["name"], verbose: true do |dest_root|
              run "bundle install && bundle exec rake --trace db:migrate RAILS_ENV=#{options[:rails_env]} && bundle exec rake --trace db:seed RAILS_ENV=#{options[:rails_env]}", verbose: true
              
              run "cp -R #{self.class.source_root}/data_acquisition/divvy.rake #{dest_root}/lib/tasks", verbose: true
              run "cp -R #{self.class.source_root}/data_acquisition/rsbc_helper.rb #{dest_root}/app/helpers", verbose: true

              run "bundle exec rake --trace rsbc RAILS_ENV=#{options[:rails_env]}", verbose: true
            end
          end
        else
          say "You have a bad repos.json file. It didn't match our expected structure.", Color::RED
        end
      end
    end

    desc "pies", "Copies piechart goods to dir containg all apps"
    method_option :app_dir, aliases: "-d", default:File.join( 'examiners_room', 'apps' ), desc: "Apps directory"
    def pies
      run "cp -R #{self.class.source_root}/data_acquisition/piecharts #{options[:basedir]}/#{options[:app_dir]}/piecharts", verbose: true
    end
  end
end