var expect = require('expect.js');
var helpers = require('../helpers');
var bowerJson = require('bower-json');
describe('rc', function() {
    var tempDir = new helpers.TempDir();
    var tempDirBowerrc = new helpers.TempDir();

    var rc = require('../../lib/util/rc');

    tempDir.prepare({
        '.bowerrc': {
            key: 'value'
        },
        'child/.bowerrc': {
            key2: 'value2'
        },
        'child2/.bowerrc': {
            key: 'valueShouldBeOverwriteParent'
        },
        'child3/bower.json': {
            name: 'without-bowerrc'
        },
        'child4/bower.json': {
            name: 'my-package',
            version: '0.0.1',
            main: 'foo.js,bar.js',
            config: {
                directory: ''
            }
        },
        'child5/bower.json': {
            name: 'my-package',
            version: '0.0.1',
            main: 'foo.js,bar.js'
        },
        'child6/bower.json': {
            name: 'my-package',
            version: '0.0.1',
            main: 'foo.js,bar.js',
            config: []
        },
        'other_dir/.bowerrc': {
            key: 'othervalue'
        }
    });

    tempDirBowerrc.prepare({
        '.bowerrc/foo': {
            key: 'bar'
        }

    });

    it('correctly reads .bowerrc files', function() {
        var config = rc('bower', tempDir.path);

        expect(config.key).to.eql('value');
        expect(config.key2).to.eql(undefined);
    });

    it('correctly reads .bowerrc files from child', function() {
        var config = rc('bower', tempDir.path + '/child/');

        expect(config.key).to.eql('value');
        expect(config.key2).to.eql('value2');
    });

    it('correctly reads .bowerrc files from child2', function() {
        var config = rc('bower', tempDir.path + '/child2/');

        expect(config.key).to.eql('valueShouldBeOverwriteParent');
        expect(config.key2).to.eql(undefined);
    });

    it('correctly reads .bowerrc files from child3', function() {
        var config = rc('bower', tempDir.path + '/child3/');

        expect(config.key).to.eql('value');
        expect(config.key2).to.eql(undefined);
    });

    it('loads the .bowerrc file from the cwd specified on the command line', function(){
        var argv = {
            'config': {
                'cwd': tempDir.path + '/other_dir/'
            }
        };

        var config = rc('bower', tempDir.path, argv);

        expect(config.key).to.eql('othervalue');

    });

    it('throws an easy to understand error if .bowerrc is a dir', function() {
        // Gotta wrap this to catch the error
        var config = function () {
            rc('bower', tempDirBowerrc.path);
        };

        expect(config).to.throwError(/should not be a directory/);
    });

    describe('When bower.json', function() {
        it('is not present', function(){
            var config = rc('bower', tempDir.path);
            expect(config.bower_json).to.be(undefined);
        });

        it('is present and theres valid config', function(){
            var config = rc('bower', tempDir.path + '/child4/');
            console.log(config);
            expect(config.bower_json).to.be.an('object');
            expect(config.bower_json.config).to.be.an('object');
            expect(bowerJson.validate(config.bower_json)).to.be.an('object');
        });

        it('is present and theres no config field', function(){
            var config = rc('bower', tempDir.path + '/child5/');
            expect(config.bower_json).to.be.an('object');
            expect(bowerJson.validate(config.bower_json)).to.be.an('object');
            expect(config.bower_json.config).to.be(undefined);
        });

        it('is present and config field has invalid type', function(){
            var config = function() {
                rc('bower', tempDir.path + '/child6/');
            };
            expect(config).to.throwError('bower.json config field should be an Object');
        });
    });
});
