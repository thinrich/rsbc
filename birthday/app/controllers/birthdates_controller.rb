class BirthdatesController < ApplicationController
  # GET /birthdates
  # GET /birthdates.json
  def index
    @birthdates = Birthdate.all

    respond_to do |format|
      format.html # index.html.erb
      format.json { render json: @birthdates }
    end
  end

  # GET /birthdates/1
  # GET /birthdates/1.json
  def show
    @birthdate = Birthdate.find(params[:id])

    respond_to do |format|
      format.html # show.html.erb
      format.json { render json: @birthdate }
    end
  end

  # GET /birthdates/new
  # GET /birthdates/new.json
  def new
    @birthdate = Birthdate.new

    respond_to do |format|
      format.html # new.html.erb
      format.json { render json: @birthdate }
    end
  end

  # GET /birthdates/1/edit
  def edit
    @birthdate = Birthdate.find(params[:id])
  end

  # POST /birthdates
  # POST /birthdates.json
  def create
    @birthdate = Birthdate.new(params[:birthdate])

    respond_to do |format|
      if @birthdate.save
        format.html { redirect_to @birthdate, notice: 'Birthdate was successfully created.' }
        format.json { render json: @birthdate, status: :created, location: @birthdate }
      else
        format.html { render action: "new" }
        format.json { render json: @birthdate.errors, status: :unprocessable_entity }
      end
    end
  end

  # PUT /birthdates/1
  # PUT /birthdates/1.json
  def update
    @birthdate = Birthdate.find(params[:id])

    respond_to do |format|
      if @birthdate.update_attributes(params[:birthdate])
        format.html { redirect_to @birthdate, notice: 'Birthdate was successfully updated.' }
        format.json { head :no_content }
      else
        format.html { render action: "edit" }
        format.json { render json: @birthdate.errors, status: :unprocessable_entity }
      end
    end
  end

  # DELETE /birthdates/1
  # DELETE /birthdates/1.json
  def destroy
    @birthdate = Birthdate.find(params[:id])
    @birthdate.destroy

    respond_to do |format|
      format.html { redirect_to birthdates_url }
      format.json { head :no_content }
    end
  end
end
