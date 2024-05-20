pub fn func_if_let () {
    let optional_value = Some(5);

    if let Some(value) = optional_value {
        println!("Value is: {}", value);
    } else {
        println!("No value");
    }

}