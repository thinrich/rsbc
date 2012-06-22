require 'thor'
require 'git_crawler/crawler'

module GitCrawler

  class ThorGitCrawler < Thor
    include Thor::Shell

    no_tasks do
      def authenticate
        puts ask( "Github username: " )

        puts ask( "Github password: " )
      end
    end

    def initialize(*)
      super
      @git_crawler = Crawler.instance
    end

    desc "search KEYWORD,...", "search github repos by keywords"
    method_option :language, aliases: "-l", default: "ruby", desc: "Refine by language"

    def search( *keywords )
      authenticate
      @git_crawler.search( keywords )
    end


  end

end