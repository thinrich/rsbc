require 'singleton'
require 'github_api' unless defined?(Github)

module GitCrawler
  class Crawler
    include Singleton

    attr_reader :github

    def authenticate( username, password )
      @github = Github.new basic_auth: '#{username}:#{password}'
      puts @github.inspect
    end

    def search( *keywords )
      puts "use github api to search"
    end

  end
end
