# Declare what sanitizer to use in a model

require 'active_support/core_ext/hash/slice'

module ActiveModel

  # == Active Model sanitizes method
  module Sanitizations
    module ClassMethods
      # This method is a shortcut to all default validators and any custom
      # validator classes ending in 'Validator'. Note that Rails default
      # validators can be overridden inside specific classes by creating
      # custom validator classes in their place such as PresenceValidator.
      #
      # Examples of using the default rails validators:
      #
      #   validates :terms, :acceptance => true
      #   validates :password, :confirmation => true
      #   validates :username, :exclusion => { :in => %w(admin superuser) }
      #   validates :email, :format => { :with => /\A([^@\s]+)@((?:[-a-z0-9]+\.)+[a-z]{2,})\Z/i, :on => :create }
      #   validates :age, :inclusion => { :in => 0..9 }
      #   validates :first_name, :length => { :maximum => 30 }
      #   validates :age, :numericality => true
      #   validates :username, :presence => true
      #   validates :username, :uniqueness => true
      #
      # The power of the +validates+ method comes when using custom validators
      # and default validators in one call for a given attribute e.g.
      #
      #   class EmailValidator < ActiveModel::EachValidator
      #     def validate_each(record, attribute, value)
      #       record.errors.add attribute, (options[:message] || "is not an email") unless
      #         value =~ /\A([^@\s]+)@((?:[-a-z0-9]+\.)+[a-z]{2,})\z/i
      #     end
      #   end
      #
      #   class Person
      #     include ActiveModel::Validations
      #     attr_accessor :name, :email
      #
      #     validates :name, :presence => true, :uniqueness => true, :length => { :maximum => 100 }
      #     validates :email, :presence => true, :email => true
      #   end
      #
      # Validator classes may also exist within the class being validated
      # allowing custom modules of validators to be included as needed e.g.
      #
      #   class Film
      #     include ActiveModel::Validations
      #
      #     class TitleValidator < ActiveModel::EachValidator
      #       def validate_each(record, attribute, value)
      #         record.errors.add attribute, "must start with 'the'" unless value =~ /\Athe/i
      #       end
      #     end
      #
      #     validates :name, :title => true
      #   end
      #
      # Additionally validator classes may be in another namespace and still used within any class.
      #
      #   validates :name, :'film/title' => true
      #
      # The validators hash can also handle regular expressions, ranges, 
      # arrays and strings in shortcut form, e.g.
      #
      #   validates :email, :format => /@/
      #   validates :gender, :inclusion => %w(male female)
      #   validates :password, :length => 6..20
      #
      # When using shortcut form, ranges and arrays are passed to your
      # validator's initializer as +options[:in]+ while other types including
      # regular expressions and strings are passed as +options[:with]+
      #
      # Finally, the options +:if+, +:unless+, +:on+, +:allow_blank+, +:allow_nil+ and +:strict+ 
      # can be given to one specific validator, as a hash:
      #
      #   validates :password, :presence => { :if => :password_required? }, :confirmation => true
      #
      # Or to all at the same time:
      #
      #   validates :password, :presence => true, :confirmation => true, :if => :password_required?
      #
      def sanitizes(*attributes)
        defaults = attributes.extract_options!
        sanitizations = defaults.slice!(*_sanitizes_default_keys)

        raise ArgumentError, "You need to supply at least one attribute" if attributes.empty?
        raise ArgumentError, "You need to supply at least one validation" if validations.empty?

        defaults.merge!(:attributes => attributes)

        sanitizations.each do |key, options|
          key = "#{key.to_s.camelize}Sanitizer"

          begin
            sanitizer = key.include?('::') ? key.constantize : const_get(key)
          rescue NameError
            raise ArgumentError, "Unknown sanitizer: '#{key}'"
          end

          sanitizes_with(sanitizer, defaults.merge(_parse_sanitizes_options(options)))
        end
      end

      # This method is used to define validation that can not be corrected by end user
      # and is considered exceptional. 
      # So each validator defined with bang or <tt>:strict</tt> option set to <tt>true</tt>
      # will always raise <tt>ActiveModel::InternalValidationFailed</tt> instead of adding error
      # when validation fails
      # See <tt>validates</tt> for more information about validation itself.
#      def validates!(*attributes)
#        options = attributes.extract_options!
#        options[:strict] = true
#        validates(*(attributes << options))
#      end

    protected

      # When creating custom validators, it might be useful to be able to specify
      # additional default keys. This can be done by overwriting this method.
      def _sanitizes_default_keys
        [ :if, :unless, :on, :allow_blank, :allow_nil , :strict]
      end

      def _parse_sanitizes_options(options) #:nodoc:
        case options
        when TrueClass
          {}
        when Hash
          options
        when Range, Array
          { :in => options }
        else
          { :with => options }
        end
      end
    end
  end
end

# from activemodel/validations/with.rb
module ActiveModel
  module Sanitizers
    module ClassMethods
      # Passes the record off to the class or classes specified and allows them
      # to add errors based on more complex conditions.
      #
      #   class Person
      #     include ActiveModel::Validations
      #     validates_with MyValidator
      #   end
      #
      #   class MyValidator < ActiveModel::Validator
      #     def validate(record)
      #       if some_complex_logic
      #         record.errors.add :base, "This record is invalid"
      #       end
      #     end
      #
      #     private
      #       def some_complex_logic
      #         # ...
      #       end
      #   end
      #
      # You may also pass it multiple classes, like so:
      #
      #   class Person
      #     include ActiveModel::Validations
      #     validates_with MyValidator, MyOtherValidator, :on => :create
      #   end
      #
      # Configuration options:
      # * <tt>:on</tt> - Specifies when this validation is active
      #   (<tt>:create</tt> or <tt>:update</tt>
      # * <tt>:if</tt> - Specifies a method, proc or string to call to determine
      #   if the validation should occur (e.g. <tt>:if => :allow_validation</tt>,
      #   or <tt>:if => Proc.new { |user| user.signup_step > 2 }</tt>).
      #   The method, proc or string should return or evaluate to a true or false value.
      # * <tt>:unless</tt> - Specifies a method, proc or string to call to
      #   determine if the validation should not occur
      #   (e.g. <tt>:unless => :skip_validation</tt>, or
      #   <tt>:unless => Proc.new { |user| user.signup_step <= 2 }</tt>).
      #   The method, proc or string should return or evaluate to a true or false value.
      # * <tt>:strict</tt> - Specifies whether validation should be strict. 
      #   See <tt>ActiveModel::Validation#validates!</tt> for more information

      # If you pass any additional configuration options, they will be passed
      # to the class and available as <tt>options</tt>:
      #
      #   class Person
      #     include ActiveModel::Validations
      #     validates_with MyValidator, :my_custom_key => "my custom value"
      #   end
      #
      #   class MyValidator < ActiveModel::Validator
      #     def validate(record)
      #       options[:my_custom_key] # => "my custom value"
      #     end
      #   end
      #
      def sanitizes_with(*args, &block)
        options = args.extract_options!
        args.each do |klass|
          sanitizer = klass.new(options, &block)
          sanitizer.setup(self) if sanitizer.respond_to?(:setup)

          if sanitizer.respond_to?(:attributes) && !sanitizer.attributes.empty?
            sanitizer.attributes.each do |attribute|
              _sanitizers[attribute.to_sym] << sanitizer
            end
          else
            _sanitizers[nil] << sanitizer
          end

          sanitize(sanitizer, options)
        end
      end
    end

    # Passes the record off to the class or classes specified and allows them
    # to add errors based on more complex conditions.
    #
    #   class Person
    #     include ActiveModel::Validations
    #
    #     validate :instance_validations
    #
    #     def instance_validations
    #       validates_with MyValidator
    #     end
    #   end
    #
    # Please consult the class method documentation for more information on
    # creating your own validator.
    #
    # You may also pass it multiple classes, like so:
    #
    #   class Person
    #     include ActiveModel::Validations
    #
    #     validate :instance_validations, :on => :create
    #
    #     def instance_validations
    #       validates_with MyValidator, MyOtherValidator
    #     end
    #   end
    #
    # Standard configuration options (:on, :if and :unless), which are
    # available on the class version of validates_with, should instead be
    # placed on the <tt>validates</tt> method as these are applied and tested
    # in the callback
    #
    # If you pass any additional configuration options, they will be passed
    # to the class and available as <tt>options</tt>, please refer to the
    # class version of this method for more information
    #
#    def validates_with(*args, &block)
#      options = args.extract_options!
#      args.each do |klass|
#        validator = klass.new(options, &block)
#        validator.validate(self)
#      end
#    end
  end
end
