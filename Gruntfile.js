/*global module:false*/
module.exports = function (grunt) {

    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-compress');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.loadNpmTasks('grunt-contrib-handlebars');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-less');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-watch');

    grunt.loadNpmTasks('grunt-gh-pages');
    grunt.loadNpmTasks('grunt-mocha');
    grunt.loadNpmTasks('grunt-jsdoc');
    grunt.loadNpmTasks('grunt-shell');

    grunt.loadTasks('tasks');

    /**
    JavaScript file include order
    Add new components to this array _after_ the components they inherit from
    */
    var includeOrder = {
        "cui": [
            // Coral core
            'cui-core.js',

            // Persistence
            'CUI.Util.state.js',

            // HTTP
            'CUI.Util.HTTP.js',
            
            // color
            'CUI.Util.color.js',

            // Components
            'components/CUI.Rail.js',
            'components/CUI.Modal.js',
            'components/CUI.Tabs.js',
            'components/CUI.Alert.js',
            'components/CUI.Popover.js',
            'components/CUI.DropdownList.js',
            'components/CUI.Dropdown.js',
            'components/CUI.Filters.js',
            'components/CUI.Slider.js',
            'components/CUI.LabeledSlider.js',
            'components/CUI.Datepicker.js',
            'components/CUI.Pulldown.js',
            'components/CUI.Sticky.js',
            'components/CUI.CardView.js',
            'components/CUI.PathBrowser.js',
            'components/CUI.Wizard.js',
            'components/CUI.FlexWizard.js',
            'components/CUI.FileUpload.js',
            'components/CUI.Toolbar.js',
            'components/CUI.Tooltip.js',
            'components/CUI.DraggableList.js',
            'components/CUI.CharacterCount.js',
            'components/CUI.Accordion.js',
            'components/CUI.Tour.js',
            'components/CUI.NumberInput.js',
            'components/CUI.Colorpicker.js',

            // Validations
            'validations.js'
        ]
    };

    /**
     * Build directories
     * Any directories used by the build should be defined here
     */
    var dirs = {
        build: 'build',
        components: 'components',
        legacy: 'legacy',
        temp: 'temp',
        modules: 'node_modules',
        externals: 'externals',
        core: {
            root: 'core/',
            build: 'core/build',
            shared: 'core/shared',
            components: 'core/components',
            tests: 'core/tests'
        }
    };

    var packages = {
        "cui": ["cui"]
    };


    /**
    Get array of CUI includes in the correct order

    @param pkg      The package to build
    @param jsPath   Base path to prepend to each include
    */
    function getIncludes(pkg, jsPath) {
        var includes = [ ];
        var def = packages[pkg];
        def.forEach(function(_set) {
            includeOrder[_set].forEach(function(_file) {
                var pref = "{build}";
                var prefLen = pref.length;
                if ((_file.length >= prefLen) && (_file.substring(0, prefLen) === pref)) {
                    includes.push(dirs.build + "/js/" + _file.substring(prefLen + 1));
                }
                includes.push(jsPath + _file);
            });
        });
        return includes;
    }

    var pkg = grunt.file.readJSON('package.json');

    // Meta and build configuration
    var meta = {
        version: pkg.version,
        appName: pkg.name,
        appWebSite: pkg.repository.url
    };


    grunt.initConfig({

        dirs: dirs,
        meta: meta,
        outputFileName: "CUI",

        clean: {
            build: '<%= dirs.build %>',
            temp: '<%= dirs.temp %>'
        }, // clean

        // Configuration
        jshint: {
            options: {
                eqeqeq: false,
                immed: true,
                latedef: true,
                newcap: true,
                noarg: true,
                sub: true,
                undef: true,
                boss: true,
                eqnull: true,
                browser: true,
                smarttabs: true,
                globals: {
                    'jQuery': true,       // jQuery
                    'CUI': true,          // CoralUI
                    'Class': true,        // Class
                    'moment': true        // Moment.js
                }
            },
            retro: [
                'Gruntfile.js',
                '<%= dirs.temp %>/js/**.js',
                '<%= dirs.temp %>/js/components/**.js'
            ]
        },

        subgrunt: {
            core: { // this will build core, which gets merged to top level build
                subdir: dirs.core.root,
                args: ['retro'] 
            },
            core_quicktest: {
                subdir: dirs.core.root,
                args: ['quicktest']                 
            },
            core_quickless: {
                subdir: dirs.core.root,
                args: ['quickless']                 
            },
            core_quickhtml: {
                subdir: dirs.core.root,
                args: ['quickhtml']                 
            }
        },

        copy: {
            retro: {
                files: [
                    { // get build from the core
                        expand: true,
                        cwd: '<%= dirs.core.build %>/',
                        src: ['examples/**', 'less/**', 'res/**', 'tests/**'],
                        dest: '<%= dirs.build %>/'
                    },
                    { // get build from the core js and copy into temp
                        expand: true,
                        cwd: '<%= dirs.core.build %>/',
                        src: ['js/cui-core.js'],
                        dest: '<%= dirs.temp %>/'
                    },
                    { // get build from the core js source (components) and copy into temp
                        expand: true,
                        flatten: true,
                        cwd: '<%= dirs.core.build %>/',
                        src: ['js/source/components/**/*.js'],
                        dest: '<%= dirs.temp %>/js/components/'
                    },
                    { // get build from the core js source (shared) and copy into temp
                        expand: true,
                        flatten: true,
                        cwd: '<%= dirs.core.build %>/',
                        src: ['js/source/*.js'],
                        dest: '<%= dirs.temp %>/js/'
                    },
                    { // get less from the modularized components
                        expand: true,
                        flatten: true,
                        cwd: '<%= dirs.components %>/',
                        src: ['**/styles/**.less'],
                        dest: '<%= dirs.build %>/less/components'
                    },
                    { // get js from the modularized components
                        expand: true,
                        flatten: true,
                        cwd: '<%= dirs.components %>/',
                        src: ['**/scripts/**.js'],
                        dest: '<%= dirs.temp %>/js/components'
                    },
                    { // get examples from the modularized components
                        expand: true,
                        cwd: '<%= dirs.components %>/',
                        src: ['**/examples/**'],
                        dest: '<%= dirs.build %>/examples',
                        filter: 'isFile',
                        rename: function(dest, src) {
                            var match = src.match(/coralui-contrib-component-(.*)\/examples\/(.*)/);
                            if (match) {
                                var component = match[1];
                                var filePath = match[2];
                                return dest + '/' + component + '/' + filePath;
                            }
                            return dest;
                        }
                    },
                    { // get tests from the modularized components
                        expand: true,
                        flatten: true,
                        cwd: '<%= dirs.components %>/',
                        src: ['**/tests/**.js'],
                        dest: '<%= dirs.build %>/tests'
                    },
                    
                    { // get legacy components' less
                        expand: true,
                        cwd: '<%= dirs.legacy %>/components/styles',
                        src: ['**'],
                        dest: '<%= dirs.build %>/less/components'
                    },

                    { // get legacy components' tests -> will override the test runner html
                        expand: true,
                        cwd: '<%= dirs.legacy %>/components/tests',
                        src: ['**'],
                        dest: '<%= dirs.build %>/tests'
                    },
                    { // get legacy components' js
                        expand: true,
                        cwd: '<%= dirs.legacy %>/components/scripts',
                        src: ['**'],
                        dest: '<%= dirs.temp %>/js/components'
                    },
                    { // get legacy js
                        expand: true,
                        filter: 'isFile',
                        cwd: '<%= dirs.legacy %>/scripts',
                        src: ['*.js'],
                        dest: '<%= dirs.temp %>/js'
                    },
                    { // get legacy resources
                        expand: true,
                        cwd: '<%= dirs.legacy %>/components/resources',
                        src: ['**'],
                        dest: '<%= dirs.build %>/res/components'
                    },
                    { // testrunner + dependencies
                        expand: true,
                        cwd: '<%= dirs.modules %>/',
                        src: [
                            'chai/chai.js',
                            'chai-jquery/chai-jquery.js',
                            'mocha/mocha.js',
                            'mocha/mocha.css'
                        ],
                        dest: '<%= dirs.build %>/tests/libs'
                    }
                ]
            },
            guide: {
                files: [
                    { // get build from the core
                        expand: true,
                        cwd: '<%= dirs.legacy %>/guide/',
                        src: ['**'],
                        dest: '<%= dirs.build %>/'
                    },
                    { // get external dependencies
                        expand: true,
                        flatten: true,
                        cwd: '<%= dirs.externals %>/',
                        src: ['*/*.js'],
                        dest: '<%= dirs.build %>/js/libs'
                    }
                ]
            },
            js_source: {
                files: [
                    { // copy all js temp files into build folder
                        expand: true,
                        cwd: '<%= dirs.temp %>/js',
                        src: ['**'],
                        dest: '<%= dirs.build %>/js/source'
                    }
                ]
            },
            release_archive: { // copy the archive to have a "latest" zip from the current build
                files: [
                    { // get build from the core
                        expand: true,
                        cwd: '<%= dirs.build %>/release/',
                        src: ['cui-<%= meta.version %>.zip'],
                        dest: '<%= dirs.build %>/release/',
                        rename: function (dest, src) {
                            return dest + '/cui-latest.zip';
                        }
                    },
                    { // get external dependencies
                        expand: true,
                        cwd: '<%= dirs.build %>/release/',
                        src: ['cui-<%= meta.version %>-full.zip'],
                        dest: '<%= dirs.build %>/release/',
                        rename: function (dest, src) {
                            return dest + '/cui-latest-full.zip';
                        }
                    }
                ]
            }
        }, // copy

        generate_imports: {
          output: '@import \'components/{filename}\';\n',
          dest: '<%= dirs.build %>/less/components.less',
          legacy: {
            src: '<%= dirs.legacy %>/components/styles/*.less'
          },
          core: {
            src: '<%= dirs.core.root %>/components/**/styles/*.less'
          },
          components: {
            src: '<%= dirs.components %>/**/styles/*.less'
          }
        },

        watch: {
            core_scripts: {
                files: [
                    dirs.core.shared + '/scripts/**.js',
                    dirs.core.tests + '/**/test.*.js',
                    dirs.core.components + '/**/scripts/**.js',
                    dirs.core.components + '/**/tests/**.js'
                ],
                tasks: ['subgrunt:core_quicktest', 'quicktest']
            }, // core_scripts
            core_styles: {
                files: [
                    dirs.core.components + '/**/styles/**.less',
                    dirs.core.shared + '/styles/**/**.less',
                ],
                tasks: ['subgrunt:core_quickless', 'quickless']
            }, // core_styles
            core_html: {
                files: [
                    dirs.core.components + '/**/examples/**.html'
                ],
                tasks: ['subgrunt:core_quickhtml', 'copy:retro'],
                options: {
                  nospawn: true
                }
            }, // core_html
            contrib_scripts: {
                files: [ 
                    dirs.components + '/**/scripts/*.js',
                    dirs.components + '/**/tests/*.js'
                ],
                tasks: ['quicktest']
            }, // contrib_scripts
            contrib_less: {
                files: [ dirs.components + '/**/styles/*.less'],
                tasks: ['quickless']
            }, // contrib_less
            contrib_html: {
                files: [ dirs.components + '/**/examples/*.html'],
                tasks: ['copy:retro']
            }, // contrib_html
            legacy_scripts: {
                files: [
                    dirs.legacy + '/components/scripts/*.js',
                    dirs.legacy + '/components/tests/test.*.js',
                    dirs.legacy + '/guide/js/guide.js'
                ],
                tasks: ['quicktest']
            }, // legacy_scripts
            legacy_styles: {
                files: [
                    dirs.legacy + '/components/styles/*.less',
                ],
                tasks: ['quickless']
            }, // legacy_styles
            guide: {
                files: [
                    dirs.legacy + '/guide/js/guide.js',
                    dirs.legacy + '/guide/less/*.less',
                    dirs.legacy + '/guide/index.html'
                ],
                tasks: ['guide']
            } // guide

        },  
        // watch

        less: {
            "cui-wrapped": {
                options: {
                    paths: [  // grunt-contrib-less doesn't support template tags, use dirs instead
                        dirs.build+'/less/'
                    ]
                },
                files: {
                    '<%= dirs.build %>/css/cui-wrapped.css': '<%= dirs.build %>/less/cui-wrapped.less'
                }
            },
            "cui": {
                options: {
                    paths: [  // grunt-contrib-less doesn't support template tags, use dirs instead
                        dirs.build+'/less/'
                    ]
                },
                files: {
                    '<%= dirs.build %>/css/cui.css': '<%= dirs.build %>/less/cui.less'
                }
            },
            guide: {
                options: {
                    paths: [  // grunt-contrib-less doesn't support template tags, use dirs instead
                        dirs.build+'/less/'
                    ]
                },
                files: {
                    '<%= dirs.build %>/css/guide.css': '<%= dirs.build %>/less/guide.less',
                    '<%= dirs.build %>/css/prettify.css': '<%= dirs.build %>/less/prettify.css'
                }
            }
        }, // less

        cssmin: {
            cui: {
                files: {
                    '<%= dirs.build %>/css/cui.min.css': '<%= dirs.build %>/css/cui.css',
                    '<%= dirs.build %>/css/cui-wrapped.min.css': '<%= dirs.build %>/css/cui-wrapped.css'
                }
            }
        }, // cssmin

        concat: {
            retro: {
                src: getIncludes("cui", dirs.temp+'/js/'),
                dest: '<%= dirs.build %>/js/<%= outputFileName %>.js'
            }
        }, // concat

        uglify: {
            retro: {
                files: {
                    '<%= dirs.build %>/js/CUI.min.js': ['<%= dirs.build %>/js/<%= outputFileName %>.js']
                }
            },
            template_components: {
                files: {
                    '<%= dirs.build %>/js/CUI.Templates.min.js': ['<%= dirs.build %>/js/CUI.Templates.js']
                }
            }
        }, // uglify

        handlebars: {
            components: {
                options: {
                    wrapped: true,
                    namespace: 'CUI.Templates',
                    processName: function (path) {
                        // Pull the filename out as the template name
                        return path.split('/').pop().split('.').shift();
                    }
                },
                files: {
                    '<%= dirs.build %>/js/CUI.Templates.js': '<%= dirs.legacy %>/components/templates/*'
                }
            }
        },

        mocha: {
            retro: {
                src: ['<%= dirs.build %>/tests/index.html'],
                options: {
                    bail: true,
                    log: true,
                    run: true
                }
            }
        }, // mocha

        jsdoc : {
            cui : {
                src: ['<%= dirs.temp %>/js/**.js', '<%= dirs.temp %>/js/components/**.js'],
                options: {
                    destination: '<%= dirs.build %>/doc',
                    template: 'res/docTemplate/'
                }
            }
        }, // jsdoc

        compress: {
            release: {
                options: {
                    archive: '<%= dirs.build %>/release/cui-<%= meta.version %>.zip'
                },
                files: [
                    { src: ['<%= dirs.build %>/css/cui.min.css'] },
                    { src: ['<%= dirs.build %>/js/CUI.min.js'] },
                    { src: ['<%= dirs.build %>/less/**'] },
                    { src: ['<%= dirs.build %>/res/**'] }
                ]
            },
            full: {
                options: {
                    archive: '<%= dirs.build %>/release/cui-<%= meta.version %>-full.zip'
                },
                files: [
                    { src: ['<%= dirs.build %>/css/**'] },
                    { src: ['<%= dirs.build %>/examples/**'] },
                    { src: ['<%= dirs.build %>/res/**'] },
                    { src: ['<%= dirs.build %>/images/**'] },
                    { src: ['<%= dirs.build %>/js/**'] },
                    { src: ['<%= dirs.build %>/doc/**'] },
                    { src: ['<%= dirs.build %>/less/**'] },
                    { src: ['<%= dirs.build %>/test/**'] },
                    { src: ['<%= dirs.build %>/index.html'] }
                ]
            },
            publish: {
                options: {
                    mode: 'tgz',
                    archive: '<%= dirs.build %>/release/<%= meta.appName %>-<%= meta.version %>.tgz'
                },
                files: [
                    {
                        expand: true,
                        cwd: '<%= dirs.build %>',
                        src: [
                            'css/**',
                            'doc/**',
                            'examples/**',
                            'images/**',
                            'js/**',
                            'less/**',
                            'res/**',
                            'tests/**',
                            '*.html'
                        ],
                        dest: 'package/'
                    }, {
                        expand: true,
                        src: [
                            'package.json',
                            'README.md'
                        ],
                        dest: 'package/'

                    }
                ]
            }
        }, // compress

        'gh-pages': {
            options: {
                base: '<%= dirs.build %>',
                repo: 'git@git.corp.adobe.com:Coral/CoralUI.git',
                clone: '<%= dirs.temp %>/gh-pages',
                branch: 'gh-pages',
                message: '@releng github pages to <%= meta.version %>'
            },
            release: {
                src: [
                    'index.html',
                    'bug_template.html',
                    'css/**',
                    'js/**',
                    'doc/**',
                    'res/**',
                    'images/**',
                    'examples/**',
                    'release/**'
                ]
            }
        },
        "shell": {
            "local-publish": {
                "command": "coralui-local-publish <%= meta.appName %> <%= dirs.build %>/release/<%= meta.appName %>-<%= meta.version %>.tgz",
                "options": {
                    stdout: true,
                    stderr: true
                }
            },
            "publish": {
                "command": "npm publish <%= dirs.build %>/release/<%= meta.appName %>-<%= meta.version %>.tgz",
                "options": {
                    stderr: true
                }
            }
        }

    }); // end init config

    grunt.task.registerTask('guide', [
        'copy:guide',
        'less:guide'
    ]);


    grunt.task.registerTask('retro', [
        'clean',
        'subgrunt:core',
        'copy:retro',
        'generate-imports',
        'less:cui',
        'less:cui-wrapped',
        'cssmin:cui',
        'jshint:retro', // hint js in temp folder
        'concat:retro',
        'uglify:retro',
        'copy:js_source',
        'guide'
    ]);

    grunt.task.registerTask('full', [ // for a standalone upload e.g. pages
        'retro',
        'handlebars:components',
        'uglify:template_components',
        'compress:release',
        'compress:full',
        'copy:release_archive',
        'mocha',
        'jsdoc'
    ]);

    grunt.task.registerTask('check', [ // supposed to be execute prior to any commit!
        'full'
    ]);

    grunt.task.registerTask('quicktest', [
        'clean:temp', 
        'copy:retro',
        'jshint:retro', 
        'concat:retro',
        'mocha',
        'uglify:retro',
        'copy:js_source'
    ]);

    grunt.task.registerTask('quickless', [
        'copy:retro',
        'generate-imports',
        'less:cui',
        'less:cui-wrapped',
        'cssmin:cui',
    ]);

    grunt.task.registerTask('quickbuild', [
        'quickless',
        'guide'
    ]);

    grunt.task.registerTask('watch-start', [
        'quickbuild',
        'quicktest',
        'watch'
    ]);

    grunt.task.registerTask('release', [ // releases coral to github page
        'check',
        'gh-pages:release'
    ]);

    grunt.task.registerTask('publish-build', [
        'full',
        'compress:publish'
    ]);

    grunt.task.registerTask('publish', [ // publish NPM package
        'publish-build',
        'shell:publish'
    ]);

    grunt.task.registerTask('local-publish', [ // publish NPM package locally
        'publish-build',
        'shell:local-publish'
    ]);

    // Default task
    grunt.task.registerTask('default', [
        'retro'
    ]);

};
