require 'httparty'
require 'json'
module Examiner
  class Crawler
    include HTTParty

    base_uri "https://api.github.com/legacy/repos"

    class << self
      def search( options={} )
        raise ArgumentError, "You must search for something" if options.empty?
        raise ArugmentError, "Hash must contain :keywords key" unless options.has_key?(:keywords)

        response = get( "/search/#{options.delete( :keywords )}", options )

        begin
          JSON::parse response.body
        rescue JSON::ParserError
          { status: :fail, error: JSON::ParserError }
        end
      end
    end
  end
end