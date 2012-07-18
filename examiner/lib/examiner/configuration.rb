module Examiner
  module Configuration

    VALID_KEYS = [
      :repo_container_dir,
      :repo_suffix,
      :log_entry_format,
      :report_dir,
      :github_search_uri,
      :search_keyword
    ].freeze

    DEFAULT_REPO_CONTAINER_DIR  = "repos"

    DEFAULT_REPO_SUFFIX         = "repo"

    DEFAULT_LOG_ENTRY_FORMAT    = ""

    DEFAULT_REPORT_DIR          = ""

    DEFAULT_GITHUB_SEARCH_URI   = "https://api.github.com/legacy/repos/search"

    DEFAULT_SEARCH_KEYWORD      = "ruby on rails"

    attr_accessor( *VALID_KEYS )

    def configure
      yield self
    end

    def self.extended( base ) 
      base.set_defaults
    end

    def set_defaults
      self.repo_container_dir   = DEFAULT_REPO_CONTAINER_DIR
      self.repo_suffix          = DEFAULT_REPO_SUFFIX
      self.log_entry_format     = DEFAULT_LOG_ENTRY_FORMAT
      self.report_dir           = DEFAULT_REPORT_DIR
      self.github_search_uri    = DEFAULT_GITHUB_SEARCH_URI
      self.search_keyword       = DEFAULT_SEARCH_KEYWORD
    end
  end
end