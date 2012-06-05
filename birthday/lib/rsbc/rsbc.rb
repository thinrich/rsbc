module Rsbc

  module Client

    class ClientValidations
      attr_accessor :validators, :model
      def initialize( model, opts={} )
        @model = model
        @validators = {}
      end

      def add( name, validator=nil )
        #@validators[name] ||= []
        @validators[name] = ClientValidator.new( validator )
      end

      def []( index )
        @validators[index]
      end

      def []=(index, val)
        @validators[index] = val
      end

      def last
        @validators.last
      end
    end

    class ClientValidator
      attr_accessor :dependents, :messages, :ast
      def initialize( validator )
        @validator = validator
        @dependents = []
        @messages = []
        @ast = nil
      end


    end

    def client_validation( name, &validator )
      name = name.to_sym unless name.kind_of?(Symbol)

      self.class.send :attr_reader, :client_validations

      #is self the object calling this method or the module Client?
      @client_validations ||= ClientValidations.new( self )
      @active_name = name
      @client_validations.add( name )

      validator.call
    end

    def req( *dependents )
      validator = @client_validations[@active_name]
      validator.dependents + dependents
      # dependents.each do |dependent|
      #   validator.dependents + dependent
      # end
    end

    def fail( msg )
      validator = @client_validations[@active_name]
      validator.messages << { type: :error, message: msg }
    end

    def client_validate( &block )
      validator = @client_validations[@active_name]
      #validator.ast = block.to_ast
      block.call 
    end
  end
end