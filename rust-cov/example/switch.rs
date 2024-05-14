fn switch_case(x: i32) -> String {
    match x {
        1 => "January".to_string(),
        2 => "February".to_string(),
        3 => "March".to_string(),
        4 => "April".to_string(),
        5 => "May".to_string(),
        6 => "June".to_string(),
        7 => "July".to_string(),
        8 => "August".to_string(),
        9 => "September".to_string(),
        10 => "October".to_string(),
        11 => "November".to_string(),
        12 => "December".to_string(),
        _ => "Invalid month".to_string(),
    }
}