require 'sinatra'

set :public_dir, File.join(File.dirname(__FILE__), 'public')

get '/' do
  File.read('index.html')
end

run Sinatra::Application
