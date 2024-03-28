use std::fs;

fn main() -> Result<(), Box<dyn std::error::Error>> {
	
    let paths = fs::read_dir("./src/api/grpc/schema")?;

    for path in paths {
        let path = path?.path();
        if path.extension().unwrap_or_default() == "proto" {
            tonic_build::compile_protos(path)?;
        }
    }

    Ok(())
}
