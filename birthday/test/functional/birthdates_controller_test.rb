require 'test_helper'

class BirthdatesControllerTest < ActionController::TestCase
  setup do
    @birthdate = birthdates(:one)
  end

  test "should get index" do
    get :index
    assert_response :success
    assert_not_nil assigns(:birthdates)
  end

  test "should get new" do
    get :new
    assert_response :success
  end

  test "should create birthdate" do
    assert_difference('Birthdate.count') do
      post :create, birthdate: @birthdate.attributes
    end

    assert_redirected_to birthdate_path(assigns(:birthdate))
  end

  test "should show birthdate" do
    get :show, id: @birthdate
    assert_response :success
  end

  test "should get edit" do
    get :edit, id: @birthdate
    assert_response :success
  end

  test "should update birthdate" do
    put :update, id: @birthdate, birthdate: @birthdate.attributes
    assert_redirected_to birthdate_path(assigns(:birthdate))
  end

  test "should destroy birthdate" do
    assert_difference('Birthdate.count', -1) do
      delete :destroy, id: @birthdate
    end

    assert_redirected_to birthdates_path
  end
end
