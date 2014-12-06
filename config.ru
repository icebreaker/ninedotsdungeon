require 'sinatra'

set :public_dir, File.dirname(__FILE__)

get '/' do
  File.read('index.html')
end

run Sinatra::Application
