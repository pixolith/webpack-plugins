const consola = require('consola');
const changeCase = require('change-case');
const path = require('path');
const FilenameLinterPlugin = function FilenameLinterPlugin(options) {
    this.pluginName = 'FilenameLinterPlugin';
    this.options = options;
};

FilenameLinterPlugin.prototype.apply = function(compiler) {
    const options = this.options;

    const ignoreFiles = [/node_modules/].concat(this.options.ignoreFiles);
    const prefix = this.options.prefix
        ? new RegExp(`/^${this.options.prefix}+.*/g`)
        : /^_+.*/g;

    compiler.hooks.shouldEmit.tap('FilenameLinterPlugin', (compilation) => {
        let files = Array.from(compilation.fileDependencies).filter(
            (dep) => !ignoreFiles.filter((ignore) => ignore.test(dep)).length,
        );
        let invalidFiles = files
            .map((file) => {
                let ext = path.extname(file),
                    fileType = ext.replace('.', ''),
                    rule = options.rules[fileType],
                    name = path
                        .basename(file)
                        .replace(ext, '')
                        .replace(prefix, '');

                if (!rule) {
                    consola.info(
                        `[${this.pluginName}]: '${fileType}' has no defined rule`,
                    );
                    return false;
                }

                if (!changeCase[rule]) {
                    consola.info(
                        `[${this.pluginName}]: '${rule}' is not part of changeCases set - skipping`,
                    );
                    return false;
                }

                if (changeCase[rule](name) === name) {
                    return false;
                }

                return {
                    error: file,
                    valid: changeCase[rule](name),
                };
            })
            .filter((file) => file);

        if (invalidFiles.length) {
            compilation.errors.push(
                new Error(
                    `${this.pluginName}\r\n${invalidFiles
                        .map(
                            (invalidFile) =>
                                `${invalidFile.error} should be: \r\n ${invalidFile.valid}`,
                        )
                        .join('\r\n')}`,
                ),
            );
        }
    });
};

module.exports = FilenameLinterPlugin;
