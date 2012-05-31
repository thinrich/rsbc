# Invokes sanitizers when an object is created: both ActiveRecord and ActiveModel

# Overriding one method: initialize.  Now it invokes sanitizers as well as type-casters
#   when new object is created.
#  Copied from rails/activerecord/lib/active_record/core.rb
#  Don't know if all the "included do" stuff matters, so leaving it for now.

# module ActiveRecord
#   module Core
#     # extend ActiveSupport::Concern

#     # included do
#     #   ##
#     #   # :singleton-method:
#     #   #
#     #   # Accepts a logger conforming to the interface of Log4r which is then
#     #   # passed on to any new database connections made and which can be
#     #   # retrieved on both a class and instance level by calling +logger+.
#     #   config_attribute :logger, :global => true

#     #   ##
#     #   # :singleton-method:
#     #   # Contains the database configuration - as is typically stored in config/database.yml -
#     #   # as a Hash.
#     #   #
#     #   # For example, the following database.yml...
#     #   #
#     #   #   development:
#     #   #     adapter: sqlite3
#     #   #     database: db/development.sqlite3
#     #   #
#     #   #   production:
#     #   #     adapter: sqlite3
#     #   #     database: db/production.sqlite3
#     #   #
#     #   # ...would result in ActiveRecord::Base.configurations to look like this:
#     #   #
#     #   #   {
#     #   #      'development' => {
#     #   #         'adapter'  => 'sqlite3',
#     #   #         'database' => 'db/development.sqlite3'
#     #   #      },
#     #   #      'production' => {
#     #   #         'adapter'  => 'sqlite3',
#     #   #         'database' => 'db/production.sqlite3'
#     #   #      }
#     #   #   }
#     #   config_attribute :configurations, :global => true
#     #   self.configurations = {}

#     #   ##
#     #   # :singleton-method:
#     #   # Determines whether to use Time.utc (using :utc) or Time.local (using :local) when pulling
#     #   # dates and times from the database. This is set to :utc by default.
#     #   config_attribute :default_timezone, :global => true
#     #   self.default_timezone = :utc

#     #   ##
#     #   # :singleton-method:
#     #   # Specifies the format to use when dumping the database schema with Rails'
#     #   # Rakefile. If :sql, the schema is dumped as (potentially database-
#     #   # specific) SQL statements. If :ruby, the schema is dumped as an
#     #   # ActiveRecord::Schema file which can be loaded into any database that
#     #   # supports migrations. Use :ruby if you want to have different database
#     #   # adapters for, e.g., your development and test environments.
#     #   config_attribute :schema_format, :global => true
#     #   self.schema_format = :ruby

#     #   ##
#     #   # :singleton-method:
#     #   # Specify whether or not to use timestamps for migration versions
#     #   config_attribute :timestamped_migrations, :global => true
#     #   self.timestamped_migrations = true

#     #   ##
#     #   # :singleton-method:
#     #   # The connection handler
#     #   config_attribute :connection_handler
#     #   self.connection_handler = ConnectionAdapters::ConnectionHandler.new

#     #   ##
#     #   # :singleton-method:
#     #   # Specifies whether or not has_many or has_one association option
#     #   # :dependent => :restrict raises an exception. If set to true, the
#     #   # ActiveRecord::DeleteRestrictionError exception will be raised
#     #   # along with a DEPRECATION WARNING. If set to false, an error would
#     #   # be added to the model instead.
#     #   config_attribute :dependent_restrict_raises, :global => true
#     #   self.dependent_restrict_raises = true
#     # end

#     module ClassMethods

#     def initialize(attributes = nil, options = {})
#       @attributes = self.class.initialize_attributes(self.class.column_defaults.deep_dup)
#       @columns_hash = self.class.column_types.dup

#       init_internals

#       ensure_proper_type

#       run_sanitizers
	  
#       populate_with_current_scope_attributes

#       assign_attributes(attributes, options) if attributes

#       yield self if block_given?
#       run_callbacks :initialize if _initialize_callbacks.any?
#     end
#     def run_sanitizers
#       run_callbacks :sanitize
#     end
#     end
#   end
# end

# From rails/activemodel/lib/active_model/model.rb
module ActiveModel
  module Model
    include ActiveModel::Sanitizations
    def initialize(params={})
      # params.each do |attr, value|
      #   self.public_send("#{attr}=", value)
      # end if params
      run_callbacks :sanitization
    end
  end
end
