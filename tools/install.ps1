param(
    [Parameter(Mandatory=$true)][string]$SdkPath,
    [Parameter(Mandatory=$true)][string]$Profile,
    [Parameter(Mandatory=$true)][string]$TvIp
)
$ErrorActionPreference='Stop'
$root=Split-Path $PSScriptRoot
$sdk=(Resolve-Path -LiteralPath $SdkPath).Path
$dist=Join-Path $root 'dist'
if(-not (Test-Path -LiteralPath (Join-Path $dist 'index.html'))){throw 'Build the app first: pnpm build'}
$build=Join-Path $root 'build'
$src=Join-Path $build 'src'
if(Test-Path -LiteralPath $src){
    $resolvedSource=(Resolve-Path -LiteralPath $src).Path
    $expectedSource=[IO.Path]::GetFullPath((Join-Path $root 'build/src'))
    if($resolvedSource -ne $expectedSource){throw 'Unexpected build source path.'}
    Remove-Item -LiteralPath $resolvedSource -Recurse -Force
}
New-Item -ItemType Directory -Force -Path $src | Out-Null
Get-ChildItem -LiteralPath $dist | Copy-Item -Destination $src -Recurse -Force
$tizen=Join-Path $sdk 'tools\ide\bin\tizen.bat'
$sdb=Join-Path $sdk 'tools\sdb.exe'
& $tizen package -t wgt -s $Profile -o $build -- $src
if($LASTEXITCODE -ne 0){throw 'Falha ao assinar o pacote.'}
& $sdb connect "${TvIp}:26101"
if($LASTEXITCODE -ne 0){throw 'Falha ao conectar à TV.'}
& $tizen install -n 'Home OS.wgt' -s "${TvIp}:26101" -- $build
if($LASTEXITCODE -ne 0){throw 'Falha ao instalar o aplicativo.'}
& $tizen run -p TvHomeLnch.Home -s "${TvIp}:26101"
if($LASTEXITCODE -ne 0){throw 'Falha ao abrir o aplicativo.'}
