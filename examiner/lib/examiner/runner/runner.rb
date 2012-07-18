require 'thor'
require 'active_support/core_ext/object'
module Examiner
  class Runner < Thor
    include Thor::Shell
    include Thor::Actions

    source_root Examiner::SOURCE_ROOT

    no_tasks do
      def root( action, path )

      end

      def apps( action, path )

      end

      def reports( action, path )

      end


    end

    desc "examine [options]", "Run the examiner to checkout ruby on rails apps from github and perform some emperical testing on them"
    def examine
      options[:keyword] ||= Examiner.search_keyword
      options[:keyword].join "+"

      repos = Crawler.new.search options
      repos
    end

    desc "search KEYWORDS", "search github repos by keywords"
    method_option :language, aliases: "-l", default: "ruby", desc: "Refine by language"
    method_option :start_page, aliases: "-p", desc: "Start from page n"
    method_option :store, aliases: "-s", type: :boolean, default: true, desc: "Store results to file, specify basedir with -d"
    method_option :basedir, aliases: "-d", desc: "Specify base dir", default: Dir.pwd
    ### TODO: determine how to handle the keywords with spaces

    def search( keyword )
      say_status "Searching with keywords", keyword, true
      say_status "Apps written in", options[:language].capitalize, true
      say_status "Offseting with page", options[:start_page], true unless options[:start_page].nil?

      #keywords = keywords.join( "+" )

      request = "#{Examiner.github_search_uri}/#{keyword}?#{options.to_query}"

      if options[:store]
        invoke :prepare
        inside 'examiners_room', verbose: true do
          get request, "repos.json"
        end
      else
        params = { keywords: keyword }
        puts Crawler.search params.merge!( options )
      end

    end

    desc "prepare", "makes needed directory structures for tests"
    method_option :basedir, aliases: "-d", desc: "Specify base dir", default: Dir.pwd
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
    method_option :basedir, aliases: "-d", desc: "Specify base dir", default: Dir.pwd
    method_option :rails_env, aliases: "-e", desc: "Specify rails env", default: "development"
    method_option :single, type: :boolean, default: true, desc: "Execute a single test"
    def execute
      destination_root = options[:basedir]

      say_status :executing, "the tests", true

      inside 'examiners_room/apps', verbose:true do
        say_status :loading, "the repo json file", true
        json = JSON.load( File.open( "repos.json" ) )

        if json.has_key? :repositories
          how_many = options[:single] ? 1 : json[:repositories].count
          json[:repositories].take( how_many ).each do |repo|
            say_status :cloning, repo.name, true
            url = "#{repo.url}.git"
            run "git clone #{url}", verbose: true
            inside repo.name, verbose: true do
              run "bundle install RAILS_ENV=#{options[:rails_env]} && bundle exec rake --trace db:migrate RAILS_ENV=#{options[:rails_env]} && bundle exec rake --trace db:seed RAILS_ENV=#{options[:rails_env]}", verbose: true
              
              copy_file "divvy.rake", "/lib/tasks/divvy.rake", verbose: true
              copy_file "rsbc_helper.rb", "/app/helpers/rsbc_helper.rb", verbose: true

              run "bundle exec rake --trace rsbc_translate RAILS_ENV=#{options[:rails_env]}", verbose: true

            end

            inside '../logs', verbose: true do
              empty_directory repo.name
              inside repo.name, verbose: true do

              end
            end
          end
        end

        copy_file "piecharts.rb", "piecharts.rb", verbose: true
      end
    end
  end
end