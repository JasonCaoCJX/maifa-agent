import copydir from 'copy-dir'
copydir.sync(process.cwd() + '/src/assets', process.cwd() + '/dist/assets', {
    utimes: true,
    mode: true,
    cover: true
}, function (err) {
    if (err) throw err
    console.log('done')
})
