# coding: utf-8
lib = File.expand_path('../lib', __FILE__)
$LOAD_PATH.unshift(lib) unless $LOAD_PATH.include?(lib)
require 'knocked_out/version'

Gem::Specification.new do |spec|
  spec.name          = "knocked_out"
  spec.version       = KnockedOut::VERSION
  spec.authors       = ["Raul E Rangel"]
  spec.email         = ["Raul@kapost.com"]
  spec.summary       = %q{A set of knockout helpers to make life simple.}
  spec.description   = %q{Provides a VM layer that is compatable with Backbone Models.}
  spec.homepage      = "https://github.com/kapost/knocked_out"
  spec.license       = "MIT"

  spec.files         = `git ls-files -z`.split("\x0")
  spec.executables   = spec.files.grep(%r{^bin/}) { |f| File.basename(f) }
  spec.test_files    = spec.files.grep(%r{^(test|spec|features)/})
  spec.require_paths = ["lib"]

  spec.add_development_dependency "coffee-script"

  spec.add_development_dependency "bundler", "~> 1.7"
  spec.add_development_dependency "rake", "~> 10.0"
end
