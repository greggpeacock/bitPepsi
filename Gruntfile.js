module.exports = function(grunt) {

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    stripJsonComments: {
      dist: {
        files: {
          'config/<%= pkg.name %>.stripped.json': 'config/<%= pkg.name %>.json'
        }
      }
    },
    concat: {
      options: {
        separator: ';'
      },
      dist: {
        src: ['src/**/*.js'],
        dest: 'dist/<%= pkg.name %>.js'
      }
    },
    uglify: {
      options: {
        mangle: false,
        compress: false,
        wrap: false,
        preserveComments: false,
      },
      dist: {
        files: {
          'dist/<%= pkg.name %>.min.js': ['<%= concat.dist.dest %>']
        }
      }
    },
    qunit: {
      files: ['test/**/*.html']
    },
    jshint: {
      // files:['Gruntfile.js', 'src/**/*.js', 'test/**/*.js'],
      files:['Gruntfile.js', 'index.js'],
      options: {
        globals: {
          jQuery: true,
          console: true,
          module: true,
          document: true
        }
      }
    },
    watch: {
      files: ['<%= jshint.files %>'],
      // tasks: ['jshint', 'qunit']
      tasks: ['jshint']
    }
  });

  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-qunit');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-strip-json-comments');

  grunt.registerTask('test', ['jshint', 'qunit']);

  //grunt.registerTask('default', ['jshint', 'qunit', 'concat', 'uglify']);
  // grunt.registerTask('default', ['concat', 'uglify']);
  grunt.registerTask('default', ['stripJsonComments']);

};
